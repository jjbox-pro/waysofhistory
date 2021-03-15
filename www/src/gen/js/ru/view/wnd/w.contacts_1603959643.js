wContacts = function(){
	wContacts.superclass.constructor.apply(this, arguments);
	
	if( this.data.callback )
		this.options.showBack = true;
		
	this.options.hasReqData = true;
};

utils.extend(wContacts, Wnd);

WndMgr.regWnd('contacts', wContacts);


wContacts.prepareData = function(data){
	return data||{};
};


wContacts.prototype.calcName = function(){
	return 'contacts';
};

wContacts.prototype.calcChildren = function(){
	for(var type in Contact.types){
		type = Contact.types[type];
		
		this.children[type.name] = utils.clone(type);
	}
};

    wContacts.prototype.initChild = function(name, childData){
        return this.children[name] = new bContactsGroup(this, childData);
    };

wContacts.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('submit', '.contacts-addContact', function(){
			if( $(this).is(':hidden') ){
				$(this).slideDown();
			}
			else{
				var $input = $(this).find('input[name="name"]'),
					name = $input.val();
				
				if( name )
					self.addContact(name, $(this).find('input:checked').val(), $input);
			}
			
			return false;
		})
		.on('click', '.contacts-addContactBtn', function(){
			self.wrp.find('.contacts-addContact').trigger('submit');
		})
		.on('click', '.-type-delete', function(){
			var contactId = $(this).closest('.contacts-contact').data('id');
			
			wndMgr.addConfirm().onAccept = function(){
				self.delContact(contactId);
			};
		});
		
	if( this.data.callback ){
		this.wrp.on('click', '.contacts-contact .link', function(){			
			self.data.callback(wofh.contacts.getElem($(this).closest('.contacts-contact').data('id')));
			
			tooltipMgr.hide();
			
			self.close();
			
			return false;
		});
	}
};

wContacts.prototype.afterDraw = function(){
	var self = this;
	
	this.alignGroupsHeight();
	
	this.wrp.find('.contacts-group').droppable({
		drop: function( event, ui ) {
			var $contact = ui.draggable,
				contactId = $contact.data('id'),
				fromType = $contact.closest('.contacts-group').data('type'),
				toType = $(event.target).data('type');
			
			self.moveContact(contactId, fromType, toType);
		},
		activate: function(event, ui) {
			$(this).addClass('-active');
			
			ui.draggable.closest('.contacts-group').addClass('-type-selected');
			
			self.wrp.find('.contacts-dropShadow').addClass('-active');
		},
		deactivate: function() {
			$(this).removeClass('-active -type-selected');
			
			self.wrp.find('.contacts-dropShadow').removeClass('-active');
		}
	});
};


wContacts.prototype.alignGroupsHeight = function(){
	var maxHeight = 0;
	
	for(var child in this.children){
		this.children[child].wrp.height('');
	}
	
	for(var child in this.children){
		child = this.children[child];
		
		var height = child.wrp.height();
		
		maxHeight = Math.max(height, maxHeight);
	}
	
	for(var child in this.children){
		child = this.children[child].wrp.height(maxHeight);
	}
};

wContacts.prototype.addContact = function(name, typeName, $input){
	var self = this;
	
	var loaderId = contentLoader.start(
		this.wrp.find('.wnd-cont-wrp'), 
		0, 
		function(){
			self.getReqData(function(){
				reqMgr.getPlayerIdByName(name, function(account, reqId){
					self.tryProcessResp(
						account, reqId,
						function(){
							contentLoader.stop(loaderId);
							
							if( account.id == wofh.account.id )
								wndMgr.addAlert('Нельзя добавить себя в список контактов');
							else if( account.id == 0 )
								wndMgr.addAlert('Игрок с таким именем не найден');
							else{
								$input.val('');
								
								var contact = wofh.contacts.getElem(account.id, false);

								if( contact ){
									wofh.contacts.delElem(contact);
									
									if( contact.getType() != Contact.typeIds[typeName] )
										self.children[contact.getTypeName()].show();
								}
								
								wofh.contacts.addElem(new Contact({id: account.id, name: name, race: account.race, sex: account.sex, type: Contact.typeIds[typeName]}));
								
								self.children[typeName].show();
								
								self.saveContacts();
							}
						}
					);
				});
			});
		}
	);
};

wContacts.prototype.delContact = function(contact){
	contact = wofh.contacts.delElem(contact);
	
	this.children[contact.getTypeName()].show();
	
	this.saveContacts();
};

wContacts.prototype.moveContact = function(contactId, fromType, toType){
	wofh.contacts.getElem(contactId).setType(Contact.typeIds[toType]);
	
	this.children[fromType].show();
	this.children[toType].show();
	
	this.saveContacts();
};

wContacts.prototype.saveContacts = function(){
	wofh.contacts.saveToLS();
	
	this.alignGroupsHeight();
};



bContactsGroup = function(parent, data){
	this.name = data.name;
	
	this.data = data;
	
	bContactsGroup.superclass.constructor.apply(this, arguments);
	
	this.options.clearData = false;
};

utils.extend(bContactsGroup, Block);


bContactsGroup.prototype.calcTmplFolder = function(){
	return tmplMgr.contacts.group;
};

bContactsGroup.prototype.getData = function(){
	this.data.contacts = wofh.contacts.getListByType(Contact.typeIds[this.data.name]);
	
	this.dataReceived();
};

bContactsGroup.prototype.isActualChild = function(childData){
    return childData;
};

bContactsGroup.prototype.afterDraw = function(){
	this.wrp.find('.contacts-contact').draggable({ 
		revert: 'invalid',
		containment: this.getDragContainment()
	});
};

bContactsGroup.prototype.clearGarbage = function(){
	if( !this.wrp )
		return;
	
	this.wrp.find('.contacts-contact').draggable('destroy');
};


bContactsGroup.prototype.getDragContainment = function(){
	return '.wnd-cont-wrp';
};