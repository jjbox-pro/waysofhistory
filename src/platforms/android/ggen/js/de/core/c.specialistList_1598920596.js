function SpecialistList(data, allowZero) {
	this.list = {};
	this.elemClass = Specialist;
	this.allowZero = allowZero === undefined ? true : allowZero;
	
	if( data )
		this.parse(data);
}

utils.extend(SpecialistList, CountList);

SpecialistList.prototype.parseArr = function(arr) {
	for (var specialist in arr) {
		if( utils.isArray(arr[specialist]) )
			specialist = arr[specialist];
		else
			specialist = [+specialist, arr[specialist]];
		
		this.addCount(specialist[0], specialist[1]);
	}
};

SpecialistList.prototype.extractData = function() {
	var obj = false;
    
    this.each(function(spec){
        obj = obj||{};
        
        obj[spec.getId()] = spec.getCount();
    });
    
    return obj;
};



SpecialistList.getAll = function() {
	var list = new SpecialistList();
	
	for (var specialist in lib.town.specialists) {
		list.addCount(specialist, 0);
	}
	
	return list;
};
