// 配置 Cesium 访问令牌 用于访问 Cesium 服务
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;
// 在创建 Viewer 之前配置
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.CesiumTerrainProvider({
        url: 'http://data.marsgis.cn/terrain/',
        requestWaterMask: true,
        requestVertexNormals: true
    }),
});

viewer.imageryLayers.addImageryProvider(
    new Cesium.WebMapTileServiceImageryProvider({
        // 'https://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' +
        url: 'http://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' +
            '14ba77517bab8f35dcc7d88916ee09cd',
        layer: 'tdtBasicLayer',
        style: 'default',
        format: 'image/jpeg',
        tileMatrixSetID: 'GoogleMapsCompatible',
        show: true,
    })
);

// 改一下地图按键（右键旋转地图）
viewer.scene.screenSpaceCameraController.zoomEventTypes = [
    Cesium.CameraEventType.WHEEL,
    Cesium.CameraEventType.PINCH
];
viewer.scene.screenSpaceCameraController.tiltEventTypes = [
    Cesium.CameraEventType.RIGHT_DRAG,
    Cesium.CameraEventType.PINCH,
    {
        eventType: Cesium.CameraEventType.LEFT_DRAG,
        modifier: Cesium.KeyboardEventModifier.CTRL
    }
];
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);

const positions = [
    116.38, 39.9, 116.4, 39.9, 116.4, 39.92, 116.38, 39.92,
]

let waterHeight = 0;
let primitive = null;

const waterMaterial = new Cesium.Material({
    fabric: {
        type: Cesium.Material.WaterType,
        uniforms: {
            baseWaterColor: new Cesium.Color(0.0, 1.3, 1.3, 1.0),
            normalMap: './image/water.jpeg',
            blendColor: new Cesium.Color(0.08, 0.16, 0.22, 0.4),
            frequency: 900.0,
            animationSpeed: 0.06,
            amplitude: 4.0,
            specularIntensity: 1.2
        }
    }
});

function createWaterPrimitive() {
    if (primitive) {
        viewer.scene.primitives.remove(primitive);
    }
    primitive = viewer.scene.primitives.add(
        new Cesium.Primitive({
            asynchronous: false,
            geometryInstances: new Cesium.GeometryInstance({
                geometry: new Cesium.PolygonGeometry({
                    polygonHierarchy: new Cesium.PolygonHierarchy(
                        Cesium.Cartesian3.fromDegreesArray(positions)
                    ),
                    height: 0,
                    vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
                    extrudedHeight: waterHeight
                })
            }),
            appearance: new Cesium.MaterialAppearance({
                material: waterMaterial,
                translucent: true,
                faceForward: true,
                closed: false
            })
        })
    );
}

viewer.scene.postRender.addEventListener(function () {
    // 修改extrudedHeight
    waterHeight += 0.1;
    createWaterPrimitive();
});

viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.38, 39.9, 1000),
    orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0
    }
});

// --- 光照与特效设置 ---

// 1. 开启地球光照与阴影
viewer.scene.globe.enableLighting = true;
viewer.shadows = true;
viewer.scene.globe.depthTestAgainstTerrain = true; // 开启地形深度检测，让阴影更准确

// 2. 设置时间为上午12点，光照效果较好
const date = new Date();
date.setHours(12);
date.setMinutes(0);
viewer.clock.currentTime = Cesium.JulianDate.fromDate(date);
viewer.clock.shouldAnimate = false; // 暂停时间，保持固定光照

// 3. 开启泛光效果 (Bloom)
viewer.scene.postProcessStages.bloom.enabled = true;
viewer.scene.postProcessStages.bloom.uniforms.contrast = 120;
viewer.scene.postProcessStages.bloom.uniforms.brightness = -0.3;
viewer.scene.postProcessStages.bloom.uniforms.stepSize = 2;
