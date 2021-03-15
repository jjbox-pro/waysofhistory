
/*
 * Интерфейс города
 */

iNoTowns = function(){
	iNoTowns.superclass.constructor.apply(this, arguments);
};

    utils.extend(iNoTowns, Interface);
	
	
	iNoTowns.prototype.calcName = function(){
        return 'noTowns';
    };
	
	iNoTowns.prototype.beforeShowChildren = function(){
        wndMgr.$body.addClass('-if-noTowns');
    };

    iNoTowns.prototype.afterDraw = function(){
        var req = {};
        req.world = location.host;
        req.name = wofh.account.name;
        req.key = wofh.account.deletelinkkey;
		
		$.post(location.protocol + '//' + lib.main.maindomain + '/aj_delfast', req);
    };