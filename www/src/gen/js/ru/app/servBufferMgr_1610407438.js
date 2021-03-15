//нужны wofh.town

var ServBufferMgr = function(callback){
    var self = this;
    
    reqMgr.getBufferData(function(data){
        self.temp = data||{};
        
        // Инициализируем разделы
        self.initAnnounces();
        self.initOptions();
        self.initAbilities();
        self.initQuests();
        self.initLastEnter();        
		self.initAudio();
		self.initStorage();
		self.initHiddenUnits();
        self.initChat();
        self.initTactics();
        self.initTimer();
		
        // Дублируем данные temp->serv
        self.serv = utils.clone(self.temp);
        
        callback();
    });
};


ServBufferMgr.sections = {
    tacticsData: 'tacticsData',
    ann: 'ann',
    options: 'options',
    abil: 'abil',
    seenSlotBuy: 'seenSlotBuy',
    questsDelayed: 'questsDelayed',
    lastEnter: 'lastEnter',
    chat: 'chat',
    audio: 'audio',
    timer: 'timer',
    storage: 'storage',
    hiddenUnits: 'hiddenUnits'
};


ServBufferMgr.prototype.initTactics = function() {
    var storage = this.setDef(this.temp, ServBufferMgr.sections.tacticsData, {});
    
    this.setDef(storage, 'templates', []);
    
    // Правим тип templates с обьекта на массив 13.01.2021 (убрать через пару недель после обновлений)
    if( !utils.isArray(storage.templates) ){
        var templates = [];
        
        for(var i in storage.templates)
            templates[i] = storage.templates[i];
        
        storage.templates = templates;
        
        setTimeout(function(){
            servBuffer.apply();
        }, 1000);
    }
    
    this.setDef(storage, 'unitTemplates', '');
};

ServBufferMgr.prototype.initAnnounces = function() {
    var storage = this.setDef(this.temp, ServBufferMgr.sections.ann, {});
    
    this.setDef(storage, 'time', 0);
};

ServBufferMgr.prototype.initOptions = function() {
    var storage = this.setDef(this.temp, ServBufferMgr.sections.options, {});
    
    this.setDef(storage, 'timeZone', Timer.getTimezoneLoc());
};

ServBufferMgr.prototype.initAbilities = function() {
    this.setDef(this.temp, ServBufferMgr.sections.abil, 0);
    
    this.setDef(this.temp, ServBufferMgr.sections.seenSlotBuy, 0);
};

ServBufferMgr.prototype.initQuests = function() {
    this.setDef(this.temp, ServBufferMgr.sections.questsDelayed, []);
};

ServBufferMgr.prototype.initLastEnter = function() {
    var storage = this.setDef(this.temp, ServBufferMgr.sections.lastEnter, {});
    
    this.setDef(storage, 'report', 0);
    this.setDef(storage, 'message', 0);
    this.setDef(storage, 'countryJoin', 0);
};

ServBufferMgr.prototype.initChat = function() {
    var storage = this.setDef(this.temp, ServBufferMgr.sections.chat, {});
    
    this.setDef(storage, 'channels', {});
};

ServBufferMgr.prototype.initAudio = function() {
	var storage = this.setDef(this.temp, ServBufferMgr.sections.audio, {});
    
    this.setDef(storage, 'globalVolume', Snd.volume.def);
};

ServBufferMgr.prototype.initTimer = function() {
	var storage = this.setDef(this.temp, ServBufferMgr.sections.timer, {});
    
    this.setDef(storage, 'countryRename', 0);
	this.setDef(storage, 'messageList', {});
};

ServBufferMgr.prototype.initStorage = function() {
	this.setDef(this.temp, ServBufferMgr.sections.storage, {});
};

ServBufferMgr.prototype.initHiddenUnits = function() {
	this.setDef(this.temp, ServBufferMgr.sections.hiddenUnits, {});
};

//установка параметров по умолчанию
ServBufferMgr.prototype.setDef = function(storage, paramName, val) {
    if( storage[paramName] === undefined )
        storage[paramName] = val;
    
    return storage[paramName];
};
//загружаем данные на сервер
ServBufferMgr.prototype.apply = function(callback) {
    var self = this;
    
	// Если в момент сохранения буфера вносились какие-то изменения, пытаемся сохранить их после возврата ответа от сервера
	if( this.save ){
		this.delayedSave = this.save;
		
		return;
	}
	
	this.save = this.temp;
	
	this.temp = utils.clone(this.serv);
	
    var save = utils.clone(this.save);
    
    reqMgr.setBufferData(
		save, 
		{
			onSuccess: function(){
				self.temp = save;
				self.serv = utils.clone(save);
				
				delete self.save;
				
				if( callback )
                    callback();
				
				if( self.delayedSave ){
					self.temp = self.delayedSave;
					
					LS.saveServStorage();
					
					delete self.delayedSave;
				}
			},
			onFail: function(){
				delete self.save;
                
				delete self.delayedSave;
			}
		}
	);
};

ServBufferMgr.prototype.getServ = function(){
	// this.save - хранит состояние, которое в данный момент сохраняется на сервере
	return this.save||this.serv;
};

ServBufferMgr.prototype.getTemp = function(){
	// this.save - хранит состояние, которое в данный момент сохраняется на сервере
	return this.save||this.temp;
};

ServBufferMgr.prototype.getServByteLength = function() {
    return utils.getStrByteLength(JSON.stringify(this.serv));
};

ServBufferMgr.prototype.getTempByteLength = function(ofServ) {
    return utils.getStrByteLength(JSON.stringify(this.temp));
};