import React, { useEffect, useRef } from 'react';

interface CesiumGlobeProps {
  selectedAsteroid: any;
  orbitalElements: any;
}

export default function CesiumGlobe({ selectedAsteroid, orbitalElements }: CesiumGlobeProps) {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    const loadCesium = async () => {
      // Check if Cesium is loaded
      if (!(window as any).Cesium) {
        console.warn('Cesium not loaded. Loading from CDN...');
        
        // Load Cesium from CDN
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Widgets/widgets.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Cesium.js';
        script.async = true;
        script.onload = () => initializeCesium();
        document.head.appendChild(script);
      } else {
        initializeCesium();
      }
    };

    const initializeCesium = () => {
      const Cesium = (window as any).Cesium;
      if (!Cesium || !cesiumContainerRef.current || viewerRef.current) return;

      try {
        // Disable Cesium Ion (we'll use free providers)
        Cesium.Ion.defaultAccessToken = undefined;

        // Initialize Cesium viewer (same as CesiumImpactVisualization)
        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: true,
          sceneModePicker: true,
          navigationHelpButton: false,
          fullscreenButton: true,
          vrButton: false,
          infoBox: true,
          selectionIndicator: true,
          terrainProvider: new Cesium.EllipsoidTerrainProvider({
            ellipsoid: Cesium.Ellipsoid.WGS84
          }),
          requestRenderMode: true,
          maximumRenderTimeChange: Number.POSITIVE_INFINITY,
          imageryProvider: false
        });

        // Add OpenStreetMap imagery layer separately
        viewer.imageryLayers.addImageryProvider(
          new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
          })
        );

        viewerRef.current = viewer;

        // Configure globe settings
        viewer.scene.globe.depthTestAgainstTerrain = false;
        viewer.scene.globe.tileCacheSize = 100;
        viewer.scene.globe.maximumScreenSpaceError = 2;
        
        // Enable lighting for beautiful Earth
        viewer.scene.globe.enableLighting = true;

        // Set initial camera position (centered view - shifted up)
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(0, 30, 15000000), // Lat 30 to shift view up
          orientation: {
            heading: 0,
            pitch: -Cesium.Math.PI_OVER_TWO + 0.15, // Slightly tilted
            roll: 0
          }
        });

        // Add asteroid trajectory if available
        if (selectedAsteroid && orbitalElements) {
          addAsteroidVisualization(viewer, selectedAsteroid, orbitalElements);
        }

      } catch (error) {
        console.error('Error initializing Cesium:', error);
      }
    };

    loadCesium();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Update visualization when asteroid changes
  useEffect(() => {
    if (viewerRef.current && selectedAsteroid) {
      addAsteroidVisualization(viewerRef.current, selectedAsteroid, orbitalElements);
    }
  }, [selectedAsteroid, orbitalElements]);

  const addAsteroidVisualization = (viewer: any, asteroid: any, elements: any) => {
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Clear existing entities
    viewer.entities.removeAll();

    // Add impact point marker if we have close approach data
    if (asteroid.close_approach_data && asteroid.close_approach_data.length > 0) {
      const approach = asteroid.close_approach_data[0];
      
      // For demonstration, place marker at a random location
      // In reality, you'd calculate the actual impact point
      const lat = (Math.random() - 0.5) * 180;
      const lng = (Math.random() - 0.5) * 360;

      viewer.entities.add({
        name: `${asteroid.name} - Potential Impact Zone`,
        position: Cesium.Cartesian3.fromDegrees(lng, lat),
        point: {
          pixelSize: 15,
          color: Cesium.Color.RED.withAlpha(0.8),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: asteroid.name,
          font: '14pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20)
        },
        description: `
          <h3>${asteroid.name}</h3>
          <p><strong>Diameter:</strong> ${asteroid.estimated_diameter?.meters?.estimated_diameter_max ? 
            (asteroid.estimated_diameter.meters.estimated_diameter_max / 1000).toFixed(2) + ' km' : 'Unknown'}</p>
          <p><strong>Velocity:</strong> ${approach.relative_velocity?.kilometers_per_second || 'Unknown'} km/s</p>
          <p><strong>Close Approach:</strong> ${approach.close_approach_date_full || 'Unknown'}</p>
          <p><strong>Miss Distance:</strong> ${approach.miss_distance?.kilometers ? 
            (parseFloat(approach.miss_distance.kilometers) / 384400).toFixed(2) + ' LD' : 'Unknown'}</p>
        `
      });

      // Fly to the impact point with centered view
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat + 15, 5000000), // Shift lat up by 15 degrees
        duration: 2.5,
        orientation: {
          heading: 0,
          pitch: -Cesium.Math.PI_OVER_TWO + 0.25, // Tilted to see impact point centered
          roll: 0
        }
      });
    }
  };

  return (
    <div 
      ref={cesiumContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }} 
    />
  );
}
