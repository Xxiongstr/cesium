// 配置 Cesium 访问令牌 用于访问 Cesium 服务
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;
// 在创建 Viewer 之前配置
const viewer = new Cesium.Viewer('cesiumContainer', {
    // terrainProvider: new Cesium.CesiumTerrainProvider({
    //     url: 'http://data.marsgis.cn/terrain/',
    //     requestWaterMask: true,
    //     requestVertexNormals: true,
    // }),
});

// viewer.imageryLayers.addImageryProvider(
//     new Cesium.WebMapTileServiceImageryProvider({
//         // 'https://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' +
//         url: 'http://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' +
//             '14ba77517bab8f35dcc7d88916ee09cd',
//         layer: 'tdtBasicLayer',
//         style: 'default',
//         format: 'image/jpeg',
//         tileMatrixSetID: 'GoogleMapsCompatible',
//         show: true,
//         minimumLevel: 0,
//         maximumLevel: 18,
//     })
// );

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

// 加载3dteilset
const left3dTileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
        url: './model/Tileset/示例建筑/tileset.json',
    })
);
left3dTileset.style = new Cesium.Cesium3DTileStyle({
    color: "color('cyan', 0.6)"
});
left3dTileset.splitDirection = Cesium.SplitDirection.LEFT; // 只显示左边

const right3dTileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
        url: './model/Tileset/示例建筑/tileset.json',
    })
);
right3dTileset.style = new Cesium.Cesium3DTileStyle({
    color: "color('red', 0.6)"
});
right3dTileset.splitDirection = Cesium.SplitDirection.RIGHT; // 只显示右边

viewer.scene.splitPosition = 0.5; // 分割线位置 改变这个分割线的位置 就可以实现卷帘对比效果

const slide = document.querySelector('.slide');
const handle = new Cesium.ScreenSpaceEventHandler(slide); // 将slide 绑定到事件处理程序
const canvasHandle = new Cesium.ScreenSpaceEventHandler();

// 是否拖动
let isDragging = false;
handle.setInputAction(() => {
    isDragging = true;
}, Cesium.ScreenSpaceEventType.LEFT_DOWN)
handle.setInputAction(() => {
    isDragging = false;
}, Cesium.ScreenSpaceEventType.LEFT_UP)
canvasHandle.setInputAction(move, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

function move(movement) {
    if (!isDragging) {
        return;
    }
    // 改变滑动条的位置
    slide.style.left = movement.endPosition.x / slide.parentElement.offsetWidth * 100 + '%';
    // 改变分割线位置
    viewer.scene.splitPosition = movement.endPosition.x / slide.parentElement.offsetWidth;
}

// 飞到3dtileset
left3dTileset.readyPromise.then(() => {
    const height = 150; // 因为地形的原因 所以需要往上抬 150 米
  const boundingSphere = left3dTileset.boundingSphere;
  const cartographic = Cesium.Cartographic.fromCartesian(
    boundingSphere.center
  );

  const surface = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height
  );

  const offset = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height + height
  );

  const translation = Cesium.Cartesian3.subtract(
    offset,
    surface,
    new Cesium.Cartesian3()
  );

  left3dTileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
  right3dTileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
  viewer.camera.flyToBoundingSphere(left3dTileset.boundingSphere);
});
