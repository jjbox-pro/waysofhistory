wSettleSpecialist = function(id, data){
	this.name = 'setSpec';
    this.hasName = 'setSpec';
	
	wSettleSpecialist.superclass.constructor.apply(this, arguments);
	
    this.options.showBack = true;
};

utils.extend(wSettleSpecialist, Wnd);

WndMgr.regWnd('setSpec', wSettleSpecialist);


wSettleSpecialist.prepareData = function(id){
	if( !(id && wofh.account.getSpecialists().getLength()) ) return false;
	
	var params = utils.urlToObj(id),
		data = {};
	
	data.specialist = (wofh.account.getSpecialists().getElem(utils.toInt(params.id), false)||wofh.account.getSpecialists().getFirst()).clone();
	data.specialist.count = 1;
	
	data.town = wofh.towns[params.town]||wofh.town;
	
	return data;
};


wSettleSpecialist.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('submit', '.js-setSpecialist', function(){
			var data = utils.serializeToObject($(this).serialize());
			
			reqMgr.setSpecialist(data.town, data.spec);
			
			self.close();
			
			return false;
		})
		.on('change', '.setSpec-select[name="spec"]', function(){
			self.data.specialist = new Specialist(+$(this).val(), 1);
			
			self.wrp.find('.js-setSpec-info').html(tmplMgr.setSpec.info({specialist:self.data.specialist}));
			self.wrp.find('.setSpec-effect').html(tmplMgr.setSpec.effect({specialist:self.data.specialist, town:self.data.town}));
		})
		.on('change', '.setSpec-select[name="town"]', function(){
			self.data.town = wofh.towns[$(this).val()];
			
			self.wrp.find('.setSpec-effect').html(tmplMgr.setSpec.effect({specialist:self.data.specialist, town:self.data.town}));
		});
		
	this.initSlider();
};


wSettleSpecialist.prototype.initSlider = function(){
	snip.specialistsSelectSldHandler(this.cont, {onSelect:this.onSelectSpec.bind(this)});
};

wSettleSpecialist.prototype.onSelectSpec = function(id){
	this.data.specialist = new Specialist(+id, 1);
	
	this.wrp.find('.js-setSpec-info').html(tmplMgr.setSpec.info({specialist:this.data.specialist}));
	this.wrp.find('.setSpec-effect').html(tmplMgr.setSpec.effect({specialist:this.data.specialist, town:this.data.town}));
};


