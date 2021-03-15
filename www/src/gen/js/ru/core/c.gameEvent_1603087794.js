function GameEvent (id) {
	this.list = id||0;
    
    for (var i in GameEvent.ids) {
        var event = GameEvent.ids[i];
        if( this.has(event) )
            wndMgr.$body.addClass('-gameEvent-' + utils.cnstName(GameEvent.ids, event));
    }
}

GameEvent.prototype.add = function (id) {
	this.list += 1<<id;
	
    wndMgr.$body.addClass('-gameEvent-' + utils.cnstName(GameEvent.ids, id));
};

GameEvent.prototype.init = function (id) {
	this.list = id;
};

GameEvent.prototype.has = function (id) {
	return (this.list & (1<<id) ) > 0;
};

GameEvent.prototype.getList = function () {
	return this.list;
};

GameEvent.ids = {
	newYear: 0,
	newYearReady: 1,
	newYear1Stage: 2,
	newYear2Stage: 3,
	newYear3Stage: 4,
	helloween: 6,
    groundhogWinter: 7,
    groundhogSpring: 8
};