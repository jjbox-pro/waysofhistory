function BuildList() {
	this.list = {};
	
	this.elemClass = Slot;
}

utils.extend(BuildList, CountList);

BuildList.prototype.filterWonders = function(onlyWonders){
    var list = new BuildList();
    for (var build in this.getList()) {
        build = this.getElem(build);
        if (build.isWonder() == onlyWonders){
            list.addElem(build);
        }
    }
    return list;
};

BuildList.getAll = function() {
    var list = new BuildList(),
		slot;
    
	for (var i=0; i<lib.builds.length; i++) {
		slot = new Slot(i);
		
		if( !slot.isHidden() )
			list.addElem(slot);
    }
	
    return list;
};