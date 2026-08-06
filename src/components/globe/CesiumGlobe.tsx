'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useInvestigationStore } from '@/store/investigation';
import type { CandidateLocation } from '@/types/analysis';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const C = () => (typeof window !== 'undefined' ? (window as any).Cesium : null) as any;

interface CesiumGlobeProps {
  onReady?: () => void;
}

export default function CesiumGlobe({ onReady }: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const entitiesRef = useRef<any[]>([]);
  const { result, selectedCandidate, cameraFlying, setCameraFlying, setShowResults } =
    useInvestigationStore();

  const initViewer = useCallback(() => {
    if (!containerRef.current || viewerRef.current) return;

    const Cesium = C();
    if (!Cesium) return;

    const token = process.env.NEXT_PUBLIC_CESIUM_TOKEN;
    if (token) Cesium.Ion.defaultAccessToken = token;

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
      contextOptions: { webgl: { alpha: true, antialias: true, preserveDrawingBuffer: true } },
      creditContainer: document.createElement('div'),
    });

    const scene = viewer.scene;
    scene.backgroundColor = Cesium.Color.BLACK;
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#080808');
    scene.globe.showGroundAtmosphere = true;
    scene.globe.enableLighting = true;
    scene.fog.enabled = true;
    scene.fog.density = 0.0003;

    scene.sun = new Cesium.Sun();
    scene.moon = new Cesium.Moon();

    try {
      const cdn = 'https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/SkyBox/';
      scene.skyBox = new Cesium.SkyBox({
        sources: {
          positiveX: cdn + 'tycho2t3_80_px.jpg',
          negativeX: cdn + 'tycho2t3_80_mx.jpg',
          positiveY: cdn + 'tycho2t3_80_py.jpg',
          negativeY: cdn + 'tycho2t3_80_my.jpg',
          positiveZ: cdn + 'tycho2t3_80_pz.jpg',
          negativeZ: cdn + 'tycho2t3_80_mz.jpg',
        },
      });
    } catch {}

    scene.skyAtmosphere = new Cesium.SkyAtmosphere();
    scene.skyAtmosphere.hueShift = -0.05;
    scene.skyAtmosphere.saturationShift = -0.3;
    scene.skyAtmosphere.brightnessShift = -0.4;

    const darkImagery = new Cesium.UrlTemplateImageryProvider({
      url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      credit: '',
    });
    viewer.imageryLayers.addImageryProvider(darkImagery);

    viewer.clock.onTick.addEventListener(() => {
      if (!cameraFlying && !result) scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0001);
    });

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
    });

    viewerRef.current = viewer;
    onReady?.();
  }, [onReady, cameraFlying, result]);

  useEffect(() => {
    // Wait for CDN script to load
    const check = () => {
      if ((window as any).Cesium) { initViewer(); } else { setTimeout(check, 100); }
    };
    check();
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = C();
    if (!viewer || !Cesium || !result) return;

    const target = selectedCandidate || {
      latitude: result.estimate.latitude,
      longitude: result.estimate.longitude,
    };
    if (target.latitude === 0 && target.longitude === 0) return;

    setCameraFlying(true);
    entitiesRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current = [];

    let satelliteLayer: any = null;
    try {
      const provider = new Cesium.IonImageryProvider({ assetId: 2 });
      satelliteLayer = viewer.imageryLayers.addImageryProvider(provider);
      satelliteLayer.alpha = 0;
    } catch {
      try {
        const arcgis = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          credit: '',
        });
        satelliteLayer = viewer.imageryLayers.addImageryProvider(arcgis);
        satelliteLayer.alpha = 0;
      } catch {}
    }

    if (satelliteLayer) {
      const fadeStart = Date.now();
      const fadeListener = () => {
        const elapsed = Date.now() - fadeStart;
        if (elapsed < 4500) satelliteLayer.alpha = Math.min(1, elapsed / 4500);
      };
      viewer.clock.onTick.addEventListener(fadeListener);
      setTimeout(() => {
        viewer.clock.onTick.removeEventListener(fadeListener);
        if (satelliteLayer) satelliteLayer.alpha = 1;
      }, 5000);
    }

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, 2000),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
      duration: 6,
      complete: () => {
        entitiesRef.current.push(
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude),
            point: {
              pixelSize: 14,
              color: Cesium.Color.fromCssColorString('#10b981'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            label: {
              text: 'INVESTIGATION TARGET',
              font: '12px JetBrains Mono, monospace',
              fillColor: Cesium.Color.fromCssColorString('#10b981'),
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              outlineColor: Cesium.Color.BLACK,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -22),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          })
        );

        entitiesRef.current.push(
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude),
            ellipse: {
              semiMajorAxis: 150, semiMinorAxis: 150,
              material: Cesium.Color.fromCssColorString('#10b981').withAlpha(0),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.6),
              outlineWidth: 2, height: 0,
            },
          })
        );

        const radius = result.confidence.coordinates > 0.7 ? 500 : result.confidence.coordinates > 0.4 ? 2000 : 5000;
        entitiesRef.current.push(
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude),
            ellipse: {
              semiMajorAxis: radius, semiMinorAxis: radius,
              material: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.1),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.35),
              height: 0,
            },
          })
        );

        result.candidates
          .filter((c) => !(Math.abs(c.latitude - target.latitude) < 0.001 && Math.abs(c.longitude - target.longitude) < 0.001))
          .slice(0, 5)
          .forEach((candidate: CandidateLocation) => {
            entitiesRef.current.push(
              viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(candidate.longitude, candidate.latitude),
                point: {
                  pixelSize: 8,
                  color: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(Math.max(0.3, candidate.confidence)),
                  outlineColor: Cesium.Color.fromCssColorString('#f59e0b'),
                  outlineWidth: 1,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                  text: candidate.city || candidate.region,
                  font: '10px JetBrains Mono, monospace',
                  fillColor: Cesium.Color.fromCssColorString('#f59e0b'),
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  outlineWidth: 1, outlineColor: Cesium.Color.BLACK,
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                  pixelOffset: new Cesium.Cartesian2(0, -12),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
              })
            );
          });

        setCameraFlying(false);
        setTimeout(() => setShowResults(true), 800);
      },
    });
  }, [result, selectedCandidate, setCameraFlying, setShowResults]);

  useEffect(() => {
    if (!selectedCandidate || !viewerRef.current || !result) return;
    viewerRef.current.camera.flyTo({
      destination: (C()).Cartesian3.fromDegrees(selectedCandidate.longitude, selectedCandidate.latitude, 3000),
      orientation: { heading: 0, pitch: (C()).Math.toRadians(-45), roll: 0 },
      duration: 2,
    });
  }, [selectedCandidate, result]);

  return <div ref={containerRef} className="absolute inset-0 z-0" style={{ background: '#000' }} />;
}
