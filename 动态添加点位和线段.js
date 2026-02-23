window.onload = function () {
    // 配置 Cesium 访问令牌 用于访问 Cesium 服务
    Cesium.Ion.defaultAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMDQyMTAzZi1iZDcxLTQ3OWUtYmFjNS1jYzk2MTRkZmIwZjUiLCJpZCI6MjkyMjgwLCJpYXQiOjE3NDQxNzk0NDB9.jtkVaDPrleaNxbbfsdKh8lenB8dFZ01vlECHsDv_lp4`;
    const viewer = new Cesium.Viewer('cesiumContainer', {
        shouldAnimate: true
    });
    let startPosition = Cesium.Cartesian3.fromDegrees(116.397428, 39.90923);
    let endPosition = Cesium.Cartesian3.fromDegrees(116.39, 39.8);

    // 初始化位置
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(116.397428, 39.90923, 5000),
    })

    // 动画函数
    const SampledPositionProperty = new Cesium.SampledPositionProperty();
    const entity = viewer.entities.add({
        position: SampledPositionProperty,
        point: {
            pixelSize: 10,
            color: Cesium.Color.RED
        }
    })

    let polyLineArr = [116.397428, 39.90923, 116.39, 39.8]
    const polylineEneity = viewer.entities.add({
        polyline: {
            positions: new Cesium.CallbackProperty(() => { // 每一帧都会出发
                return Cesium.Cartesian3.fromDegreesArray(polyLineArr);
            }),
            width: 4,
            material: Cesium.Color.BLUE
        }
    })

    let time = .5;
    let startTime = Cesium.JulianDate.now(); // 返回的是一个儒略日 时间
    let endTime = Cesium.JulianDate.addSeconds(startTime, time, new Cesium.JulianDate());

    // 时间和位置绑定
    SampledPositionProperty.addSample(startTime, startPosition);
    SampledPositionProperty.addSample(endTime, endPosition);

    // 时间轴
    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = endTime.clone();
    viewer.clock.currentTime = startTime.clone();
    viewer.clock.clockRange = Cesium.ClockRange.CLAMPED; // 停留在最后位置
    viewer.clock.multiplier = 1; // 播放速度

    
    // 跟随
    // viewer.trackedEntity = entity;

    // 点击事件
    viewer.screenSpaceEventHandler.setInputAction(function (movement) {
        // 转笛卡尔坐标
        const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
            // 计算新的结束时间（基于当前时钟时间）
            const currentTime = viewer.clock.currentTime;
            const newEndTime = Cesium.JulianDate.addSeconds(currentTime, time, new Cesium.JulianDate());

            // 线添加新的位置
            // 转成经纬度
            const newCartographic = Cesium.Cartographic.fromCartesian(cartesian); // 笛卡尔经纬度（弧度）
            const newLongitude = Cesium.Math.toDegrees(newCartographic.longitude); // 经度
            const newLatitude = Cesium.Math.toDegrees(newCartographic.latitude); // 纬度
            polyLineArr.push(newLongitude, newLatitude);
            // polylineEneity.polyline.positions = Cesium.Cartesian3.fromDegreesArray(polyLineArr);

            // 新位置
            const newPosition = cartesian;

            // 添加新样本点
            SampledPositionProperty.addSample(newEndTime, newPosition);

            // 延长动画结束时间
            viewer.clock.stopTime = newEndTime.clone();

            // 如果动画已停止，重新启动
            if (!viewer.clock.shouldAnimate) {
                viewer.clock.shouldAnimate = true;
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}