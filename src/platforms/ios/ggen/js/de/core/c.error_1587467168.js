function ErrorX (code) {
	this.list = {};
	if (code) this.getList()[code];
};

ErrorX.prototype.getList = function(){
	return this.list;
};

ErrorX.prototype.clone = function(){
    var clone = new ErrorX();
    clone.list = utils.clone(this.list);
	return clone;
};

ErrorX.prototype.add = function(code){
	this.getList()[code] = true;
    return this;
}

ErrorX.prototype.del = function(code){
	delete this.getList()[code];
}

ErrorX.prototype.isOk = function(except){
	var list = this.getList();
	
	for (var err in list) {
		if (!except || $.inArray(+err, except) == -1) {
			return false;
		}
	}
	
	return true;
}

ErrorX.prototype.has = function(code){
	return this.getList()[code]||false;
}



ErrorX.getName = function(code){
	for(var name in ErrorX.ids){
		if( ErrorX.ids[name] == code )
			return name;
	}
	
	return false;
};

ErrorX.ids = {
	WEok: 0,
	WEnoMoney: 1,
	WEunknown: 2,
	WEnoResources: 3,
	WEnoTraders: 4,
	WEnoConnection: 5,
	WEbadAccount: 6,
	WEcantLoadTown: 7,
	WEnoDataInBd: 8,
    WEnoLogin: 9,
	WEbadData: 10,
	WEnoUpdate: 11,
	WEbadCountry: 12,
	WEnoLuck: 13,
    WE14: 14,
	WEusedEmail: 15,
	WEnotAllFleet: 16,
	WEbadName: 17,
	WEalreadyUsed: 18,
	WEbadPost: 19,
	WEbadData2: 20,
	WEnoAnimals: 21,
	WEbadDistance: 22,
	WEbadEmail: 23,
	WEforeignAccount: 24,
	WElimit: 25,
	WEnoArmy: 26,
	WEbadArmy: 27,
	WEbadPath: 28,
	WEnotResearched: 29,
	WEbadPlace: 30,
	WEbadPassword: 31,
	WEdisabled: 32,
	WEbadQuest: 33,
	WEbadSize: 34,
	WEnoAccess: 35,
	WEbadKey: 36,
	WEok3: 37,
	WEbadState: 38,
	WEbadCode: 39,
	WEbadLevel: 40,
    WEbadTime: 41,
    WEbadRace: 42,
    WEcantPayTax: 43,
	WEbadCharacter: 45
};

ErrorX.idsAssist = {
	ok: 0,
	badSession: 1,
	badQuestion: 2,
	badParameters: 3,
	//RC_BadPassword: 4,
	badCommand: 5,
	unknownError: 6,
	cant: 7,
	badFormat: 8,
	largeData: 9,
	badState: 10
};