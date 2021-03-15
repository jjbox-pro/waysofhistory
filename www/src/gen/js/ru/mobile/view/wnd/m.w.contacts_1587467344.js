wContacts.prototype.getPreventSwipeCls = function(){
	var cls = wContacts.superclass.getPreventSwipeCls.apply(this, arguments);;
	
	return cls + ', .ui-draggable';
};



bContactsGroup.prototype.getDragContainment = function(){
	return '.view-contacts';
};