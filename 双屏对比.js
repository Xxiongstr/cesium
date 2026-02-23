// 配置 Cesium 访问令牌 用于访问 Cesium 服务
Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;

let cesiumContainer = ['mapLeft', 'mapRight'];
let leftViewer = null;
let rightViewer = null;
let isSyncing = false;

for (let item of cesiumContainer) {
    // 在创建 Viewer 之前配置
    const viewer = new Cesium.Viewer(item, {
        // terrainProvider: new Cesium.CesiumTerrainProvider({
        //     url: 'http://data.marsgis.cn/terrain/',
        //     requestWaterMask: true,
        //     requestVertexNormals: true,
        // }),
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
            minimumLevel: 0,
            maximumLevel: 18,
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
    if (item === 'mapLeft') {
        leftViewer = viewer;
    } else if (item === 'mapRight') {
        rightViewer = viewer;
    }
}

setupCameraSync(leftViewer, rightViewer);

/**
 * 设置双屏相机同步 - 实时同步相机视角
 * @param {mars3d.Map} mapLeft 左侧地图
 * @param {mars3d.Map} mapRight 右侧地图
 */
function setupCameraSync(mapLeft, mapRight) {
    if (!mapLeft || !mapRight) {
        console.warn('地图未初始化，无法设置双屏同步');
        return;
    }

    const viewerLeft = mapLeft;
    const viewerRight = mapRight;

    if (!viewerLeft || !viewerRight) {
        console.warn('Viewer 未初始化，无法设置双屏同步');
        return;
    }

    // 记录上次同步的相机位置，用于判断哪个相机在移动
    let lastLeftPosition = viewerLeft.camera.position.clone();
    let lastRightPosition = viewerRight.camera.position.clone();

    // 同步相机视图的辅助函数 - 直接复制相机的关键属性
    const syncCamera = (sourceCamera, targetCamera) => {
        if (window.isSyncing) return; // 防止循环同步

        window.isSyncing = true;
        try {
            // 直接复制相机的关键属性，实现完全同步
            targetCamera.position = sourceCamera.position.clone();
            targetCamera.direction = sourceCamera.direction.clone();
            targetCamera.up = sourceCamera.up.clone();
            targetCamera.right = sourceCamera.right.clone();
        } catch (error) {
            console.error('同步相机失败:', error);
        } finally {
            // 立即重置标志，允许下一帧继续同步
            window.isSyncing = false;
        }
    };

    // 在每一帧渲染后检查并同步相机（最流畅的方式）
    const postRenderHandler = () => {
        if (isSyncing) return; // 如果正在同步，跳过

        const currentLeftPos = viewerLeft.camera.position;
        const currentRightPos = viewerRight.camera.position;

        // 计算位置变化距离 主要是监听是哪边的相机移动了
        const leftDistance = Cesium.Cartesian3.distance(currentLeftPos, lastLeftPosition);
        const rightDistance = Cesium.Cartesian3.distance(currentRightPos, lastRightPosition);

        // 如果左侧相机移动了（距离变化超过阈值），同步到右侧
        if (leftDistance > 0.1) { // 0.1米的变化阈值
            syncCamera(viewerLeft.camera, viewerRight.camera);
            lastLeftPosition = currentLeftPos.clone();
            lastRightPosition = viewerRight.camera.position.clone(); // 更新右侧位置
        }
        // 如果右侧相机移动了，同步到左侧
        else if (rightDistance > 0.1) {
            syncCamera(viewerRight.camera, viewerLeft.camera);
            lastRightPosition = currentRightPos.clone();
            lastLeftPosition = viewerLeft.camera.position.clone(); // 更新左侧位置
        }
    };

    // 使用 scene.postRender 事件，每帧都会触发，实现真正的实时同步
    viewerLeft.scene.postRender.addEventListener(postRenderHandler);

    // 保存处理器引用，方便后续清理
    mapLeft._cameraSyncHandler = postRenderHandler;
    mapRight._cameraSyncHandler = postRenderHandler;

    console.log('双屏实时同步已启用（使用 postRender 事件）');
}
