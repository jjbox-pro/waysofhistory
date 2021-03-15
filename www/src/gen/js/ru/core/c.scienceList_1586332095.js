function ScienceList (data) {
	this.list = {};
	this.elemClass = Science;
	if (data) {
		this.parse(data);
	}
};

utils.extend(ScienceList, List);


ScienceList.sortByAvailCost = function(a, b){
	var aAvail = a.isAvail(),
		bAvail = b.isAvail();

	if( aAvail == bAvail )
		return a.getCost() - b.getCost();

	return bAvail - aAvail;
};


// получение всех наук (с сортировкой)
ScienceList.prototype.sort = function () {
	return this.getSortList('cost', true);
};

ScienceList.prototype.setState = function (state) {
    this.cloneElements();
    this.state = state||wofh.account.science.state;
    
    for (var sci in this.getList()){
        sci = this.getElem(sci);
        sci.setParent(this);
    }
    return this;
}

ScienceList.prototype.clone = function(){
	var opt = {};
	
	if( this.state )
		opt.extElemClone = function(cloneElem, elem, cloneList){
			cloneElem.parent = cloneList;
		};
		
    var clone = ScienceList.superclass.clone.call(this, opt);
	
	if( this.state )
		clone.state = this.state;
	
    return clone;
};
/*
//получить список наук, если завершена одна из них
ScienceList.prototype.setScienceKnown = function (science) {
	this.delElem(science);
    science = Science.getObj(science)
    
    for (var sciNext in science.next.getList()) {
        sciNext = science.next.getElem(sciNext);
        this.addElem(sciNext)
    }
    
    return this;
};*/


ScienceList.prototype.setScienceKnown = function (science) {
    var state = this.state.split('');
    
    //делаем науку изученной
    state[science.getId()] = Science.known.done;
    this.state = state.join('');
    
    //проверяем, какие науки доступны
	var list = science.next.getList();
    for (var sciNext in list) {
        sciNext = this.getElem(list[sciNext].getId()); // list[sciNext].getId() - используется такой вариант т.к. list может быть, как массивом так и объектом
        state[sciNext.getId()] = sciNext.checkDone();
    }
    this.state = state.join('');
    
    return this;
};

ScienceList.prototype.setSciencesKnown = function (sciList) {
    
    for (var sci in sciList.getList()){
        sci = sciList.getElem(sci);
        this.setScienceKnown(sci)
    }

    return this;
};

//фильтруем по типу
ScienceList.prototype.filterKnown = function(known, byCountry){
    if (typeof known != 'object'){
        known = [known];
    }
    for (var scienceId in this.getList()) {
        var science = this.getElem(scienceId);
        if (!utils.inArray(known, science.getKnown(byCountry))) {
            this.delElem(scienceId);
        }
    }
    return this;
};


ScienceList.prototype.calcBonusStoreSum = function(){
	var sum = 0,
		list = this.getList();
	
	for(var science in list)
		sum += list[science].getBonus(Science.bonus.store);
	
	return sum;
};

ScienceList.prototype.getMaxElemByCost = function(){
    var maxScience;
    for (var scienceId in this.getList()) {
        var science = this.getElem(scienceId);
        if (!maxScience || science.getCost() > maxScience.getCost()) {
            maxScience = science;
        }
    }
    return maxScience;
};

// получение всех наук
ScienceList.getAll = function () {
	return new ScienceList(lib.science.list);
};

ScienceList.hasAvail = function (country) {
    return !ScienceList.getAll().filterKnown(Science.known.avail, country).isEmpty() || Science.getScienceData(country).debt;
};

