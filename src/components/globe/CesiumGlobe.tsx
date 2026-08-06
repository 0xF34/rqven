'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import { useInvestigationStore } from '@/store/investigation';
import type { CandidateLocation } from '@/types/analysis';

// Suppress Cesium's built-in asset loading warnings
window.CESIUM_BASE_URL = process.env.NEXT_PUBLIC_CESIUM_BASE_URL || '/cesium';

interface CesiumGlobeProps {
  onReady?: () => void;
}

export default function CesiumGlobe({ onReady }: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesRef = useRef<Cesium.Entity[]>([]);
  const { result, selectedCandidate, cameraFlying, setCameraFlying, setShowResults } =
    useInvestigationStore();

  // Initialize Cesium viewer with dark globe theme
  const initViewer = useCallback(() => {
    if (!containerRef.current || viewerRef.current) return;

    const token = process.env.NEXT_PUBLIC_CESIUM_TOKEN;
    if (token) {
      Cesium.Ion.defaultAccessToken = token;
    }

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
      selectionIndicator: false,
      scene3DOnly: true,
      skyBox: false,
      skyAtmosphere: false,
      orderIndependentTranslucency: false,
      contextOptions: {
        webgl: {
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        },
      },
      creditContainer: document.createElement('div'),
    });

    // Dark globe setup - black oceans, dark continents
    const scene = viewer.scene;
    scene.backgroundColor = Cesium.Color.BLACK;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0a0a');
    scene.globe.showGroundAtmosphere = true;
    scene.globe.enableLighting = true;
    scene.fog.enabled = true;
    scene.fog.density = 0.0002;

    // Stars background
    scene.skyBox = new Cesium.SkyBox({
      sources: {
        positiveX: `${window.CESIUM_BASE_URL}/SkyBox/tycho2t3_80_px.jpg`,
        negativeX: `${window.CESIUM_BASE_URL}/SkyBox/tycho2t3_80_mx.jpg`,
        positiveY: `${window.CESIUM_BASE_URL}/SkyBox/tycho2t3_80_py.jpg`,
        negativeY: `${window.CESIUM_BASE_URL}/SkyBox/tycho2t3_80_my.jpg`,
        positiveZ: `${window.CESIUM_BASE_URL}/SkyBox/tycho2t3_80_pz.jpg`,
        negativeZ: `${window.CESIUM_BASE_URL}/SkyBox/tycho2t3_80_mz.jpg`,
      },
    });

    // Add subtle atmosphere glow
    scene.skyAtmosphere = new Cesium.SkyAtmosphere();
    scene.skyAtmosphere.hueShift = -0.05;
    scene.skyAtmosphere.saturationShift = -0.2;
    scene.skyAtmosphere.brightnessShift = -0.4;

    // Dark imagery layer for the globe
    const darkImagery = new Cesium.UrlTemplateImageryProvider({
      url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      credit: '',
    });
    viewer.imageryLayers.addImageryProvider(darkImagery);

    // Slow idle rotation
    viewer.clock.onTick.addEventListener(() => {
      if (!cameraFlying && !result) {
        scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0001);
      }
    });

    // Set initial camera position - zoomed out view of Earth
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 0,
    });

    viewerRef.current = viewer;
    onReady?.();
  }, [onReady, cameraFlying, result]);

  useEffect(() => {
    initViewer();
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to estimated location
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !result) return;

    const target = selectedCandidate || {
      latitude: result.estimate.latitude,
      longitude: result.estimate.longitude,
    };

    if (target.latitude === 0 && target.longitude === 0) return;

    setCameraFlying(true);

    // Clear previous markers
    entitiesRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current = [];

    // Add high-res satellite imagery layer (Bing Maps)
    try {
      const satelliteLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.IonImageryProvider({ assetId: 2 })
      );
      satelliteLayer.alpha = 0;

      // Animate satellite fade-in during flight
      const startTime = Cesium.JulianDate.now();
      const preUpdateListener = (clock: Cesium.Clock) => {
        const elapsed = Cesium.JulianDate.secondsDifference(
          Cesium.JulianDate.now(),
          startTime
        );
        if (elapsed < 5) {
          satelliteLayer.alpha = Math.min(1, elapsed / 4);
        }
      };
      viewer.clock.onTick.addEventListener(preUpdateListener);

      // Clean up listener after flight
      setTimeout(() => {
        viewer.clock.onTick.removeEventListener(preUpdateListener);
      }, 6000);
    } catch {
      // If Ion imagery fails, try OpenStreetMap satellite
      try {
        const osmSatellite = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          credit: '',
        });
        viewer.imageryLayers.addImageryProvider(osmSatellite);
      } catch {
        // Continue with dark imagery if all satellite sources fail
      }
    }

    // Cinematic camera flight
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        target.longitude,
        target.latitude,
        2000
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 6,
      complete: () => {
        // Add investigation marker
        const marker = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(target.latitude, target.longitude),
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString('#10b981'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: 'INVESTIGATION TARGET',
            font: '12px JetBrains Mono, monospace',
            fillColor: Cesium.Color.fromCssColorString('#10b981'),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            outlineColor: Cesium.Color.BLACK,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        entitiesRef.current.push(marker);

        // Add confidence radius circle
        const confidenceRadius =
          result.confidence.coordinates > 0.7
            ? 500
          : result.confidence.coordinates > 0.4
            ? 2000
            : 5000;

        const radiusEntity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            target.longitude,
            target.latitude
          ),
          ellipse: {
            semiMajorAxis: confidenceRadius,
            semiMinorAxis: confidenceRadius,
            material: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.15),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.5),
            height: 0,
          },
        });
        entitiesRef.current.push(radiusEntity);

        // Add candidate markers
        result.candidates
          .filter(
            (c) =>
              !(c.latitude === target.latitude && c.longitude === target.longitude)
          )
          .slice(0, 5)
          .forEach((candidate: CandidateLocation) => {
            const cMarker = viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(
                candidate.longitude,
                candidate.latitude
              ),
              point: {
                pixelSize: 8,
                color: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(
                  candidate.confidence
                ),
                outlineColor: Cesium.Color.fromCssColorString('#f59e0b'),
                outlineWidth: 1,
              },
              label: {
                text: candidate.city || candidate.region,
                font: '10px JetBrains Mono, monospace',
                fillColor: Cesium.Color.fromCssColorString('#f59e0b'),
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 1,
                outlineColor: Cesium.Color.BLACK,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -12),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
            });
            entitiesRef.current.push(cMarker);
          });

        setCameraFlying(false);
        setTimeout(() => setShowResults(true), 800);
      },
    });
  }, [result, selectedCandidate, setCameraFlying, setShowResults]);

  // Handle candidate selection
  useEffect(() => {
    if (!selectedCandidate || !viewerRef.current || !result) return;
    const viewer = viewerRef.current;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        selectedCandidate.longitude,
        selectedCandidate.latitude,
        3000
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 2,
    });
  }, [selectedCandidate, result]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ background: '#000' }}
    />
  );
}
