import * as Cesium from "cesium";

const viewer = new Cesium.Viewer("cesiumContainer");

const positions = Cesium.Cartesian3.fromDegreesArray([
  116.38, 39.9, 116.4, 39.9, 116.4, 39.92, 116.38, 39.92,
]);

const polygon = new Cesium.ClippingPolygon({
  positions: positions,
});

// 裁剪
const polygons = new Cesium.ClippingPolygonCollection({
  polygons: [polygon],
});

// 改一下地图按键（右键旋转地图）
viewer.scene.screenSpaceCameraController.zoomEventTypes = [
  Cesium.CameraEventType.WHEEL,
  Cesium.CameraEventType.PINCH,
];
viewer.scene.screenSpaceCameraController.tiltEventTypes = [
  Cesium.CameraEventType.RIGHT_DRAG,
  Cesium.CameraEventType.PINCH,
  {
    eventType: Cesium.CameraEventType.LEFT_DRAG,
    modifier: Cesium.KeyboardEventModifier.CTRL,
  },
];
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
  Cesium.ScreenSpaceEventType.RIGHT_CLICK,
);

// 裁剪地形
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.clippingPolygons = polygons;

let extrudeHeight = -500;

// 水
const waterPrimitive = viewer.scene.primitives.add(
  new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(positions),
        height: -100
      })
    }),
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: Cesium.Material.WaterType,
          uniforms: {
            baseWaterColor: new Cesium.Color(0.0, 1.3, 1.3, 1.0),
            normalMap: Cesium.buildModuleUrl('Assets/Textures/waterNormals.jpg'), // cesium 内置纹理图
            frequency: 1000.0,
            animationSpeed: 0.1,
            amplitude: 20.0,
            specularIntensity: 10
          }
        }
      })
    })
  })
);

// 创建一个面 用作底部
const bottom = viewer.entities.add({
  polygon: {
    hierarchy: positions,
    height: extrudeHeight, // 坑底高度
    material: Cesium.Color.SADDLEBROWN.withAlpha(0.4)
  },
});

viewer.entities.add({
  polygon: {
    hierarchy: positions,
    height: 10, // 地表
    extrudedHeight: extrudeHeight, // 向下拉
    material: Cesium.Color.fromCssColorString('#FFBC33').withAlpha(0.4),
    closeTop: false,
  },
});

viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(116.38, 39.9, 10000),
});
