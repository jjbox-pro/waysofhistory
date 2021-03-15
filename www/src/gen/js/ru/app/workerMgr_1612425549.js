WorkerMgr = function(){
	this.setActive(false);
};


WorkerMgr.prototype.init = function(){
	if( !window.Worker ){
		this.onInitError();
		
		return this;
	}
	
	this.worker = new Worker(utils.prepareUrl('gen/js/ru/workers/main_1612425549.js'));
    
	this.bind(this.worker, this.onmessage);
	
	this.postMessage({
		init: true,
		lib: lib,
		localStorage: LS.getActualLS(),
		debug: debug,
		root: this.getScriptsRoot()
	});
	
	return this;
};

	WorkerMgr.prototype.getScriptsRoot = function(){
		return '/';
	};

WorkerMgr.prototype.bind = function(worker, onmessage){
	worker.onmessage = onmessage.bind(this);
};

WorkerMgr.prototype.setActive = function(active){
	this.active = active;
};

WorkerMgr.prototype.isActive = function(){
	return this.active;
};

WorkerMgr.prototype.initDependencies = function(){
    if( !this.isActive() )
        return;
    
	// Карта (обработка чанков)
	bckMap.prototype.prepareChunks = bckMap.prototype.prepareChunksByWorker;
	// Расчёт строений, которые будут к постройке после изучения пары наук
	AccountScience.prototype.calcFutureBuilds = AccountScience.prototype.calcFutureBuildsByWorker;
    
    iMap.clearChunks = iMap.clearChunksByWorker;
};


WorkerMgr.prototype.postMessage = function(data){
	if( !this.worker )
		return;
    
	this.worker.postMessage([data]);
};

WorkerMgr.prototype.onmessage = function(event){
	var data = event.data;
	
	if( data.handler )
		this[data.handler](data);
};

// Обработчики
WorkerMgr.prototype.onInit = function(){
	this.setActive(true);
	
	appl.onComponentsInited();
};

WorkerMgr.prototype.onInitError = function(){
	this.setActive(false);
	
	appl.onComponentsInited();
};

WorkerMgr.prototype.onMapChunksReady = function(data){
    this.sendToReqMgr(data);
};

WorkerMgr.prototype.onFutureBuildsReady = function(data){
	this.sendToReqMgr(data);
};

WorkerMgr.prototype.onUpdWorker = function(data){
	this.sendToReqMgr(data);
};


WorkerMgr.prototype.sendToReqMgr = function(data){
	var uid = data.uid;
	
	delete data.uid;
	delete data.handler;
	
	reqMgr.respWorker(data, uid);
};