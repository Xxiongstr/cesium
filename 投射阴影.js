// 配置 Cesium 访问令牌 用于访问 Cesium 服务
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;
// 在创建 Viewer 之前配置
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.CesiumTerrainProvider({
        url: 'http://data.marsgis.cn/terrain/',
        requestWaterMask: true,
        requestVertexNormals: true,
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

// 开启阴影
viewer.shadows = true;
// 禁止地面接收阴影，只投射在物体上
// viewer.terrainShadows = Cesium.ShadowMode.DISABLED;

// 创建平行光
// viewer.scene.light = new Cesium.DirectionalLight({
//     direction: new Cesium.Cartesian3(-1.0, -1.0, -1.0),
//     color: Cesium.Color.WHITE,
//     intensity: 1.0,
// });

// 日光24小时
viewer.scene.globe.show = true; // 开启地球模型
viewer.scene.globe.enableLighting = true; // 开启光照
viewer.scene.globe.baseColor = Cesium.Color.WHITE; // 修改基本颜色，影响亮度

// 调整时间
viewer.clock.multiplier = 10000; // 时间倍率，默认值是 1.0
viewer.clock.shouldAnimate = true; // 是否开启时间动画

// 阴影映射配置 启用日光投射阴影 代替平行光
var shadowMap = viewer.scene.shadowMap;
shadowMap.enabled = true; // 开启阴影映射
shadowMap.size = 2048;  // 设置阴影分辨率
shadowMap.softShadows = true; // 开启软阴影

// 创建box立体盒子
const box = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.314521, 22.620389, 1000),
    box: {
        dimensions: new Cesium.Cartesian3(100.0, 100.0, 100.0),
        material: Cesium.Color.RED.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2.0,
        show: true,
        // 阴影
        shadows: Cesium.ShadowMode.ENABLED,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    }
});

// 创建墙 包围盒子
const box2 = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.314521, 22.620389, 1000),
    wall: {
        positions: Cesium.Cartesian3.fromDegreesArray([
            // 创建一个正方形的墙 (中心点在 114.314521, 22.620389, 盒子大小 100x100)
            // 简单估算：1经度/纬度 约等于 111km -> 1米 约等于 0.00001度
            // 半径 200米 (比盒子的100米大一点，确保包围)
            114.314521 - 0.002, 22.620389 - 0.002, // 左下
            114.314521 + 0.002, 22.620389 - 0.002, // 右下
            114.314521 + 0.002, 22.620389 + 0.002, // 右上
            114.314521 - 0.002, 22.620389 + 0.002, // 左上
            114.314521 - 0.002, 22.620389 - 0.002  // 闭合回左下
        ]),
        maximumHeights: [400, 400, 400, 400, 400], // 墙的高度 2000米
        minimumHeights: [0, 0, 0, 0, 0],    // 墙的底部高度
        material: Cesium.Color.CYAN.withAlpha(0.3), // 半透明青色
        outline: true,
        outlineColor: Cesium.Color.CYAN,
        show: true,
        // 阴影
        shadows: Cesium.ShadowMode.ENABLED,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    }
});

const box3 = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(114.314521 + 0.004, 22.620389, 1000),
    box: {
        dimensions: new Cesium.Cartesian3(100.0, 100.0, 800.0),
        material: Cesium.Color.GREEN.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2.0,
        show: true,
        // 阴影
        shadows: Cesium.ShadowMode.ENABLED,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    }
});

viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(114.314521, 22.620389, 10000.0),
    orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0
    }
})
