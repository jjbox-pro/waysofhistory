//селектор, который забирает стили из выбранных options
SelectStyled = {};

SelectStyled.wrpClass = '.js-select-styled';
SelectStyled.css = ['color', 'font-style'];

SelectStyled.bind = function(){
    var self = this;
	
    wndMgr.$body.on('change', this.wrpClass, function(){
    	self.setStyle($(this));
    });
};

SelectStyled.init = function(cont){
    var self = this;
	
	cont.find(this.wrpClass).each(function(){
    	self.setStyle($(this));
	});
};

SelectStyled.setStyle = function(el){
    var option = el.find('option:selected');
	
    var css = {};
	
    for (var prop in this.css){
    	prop = this.css[prop];
    	css[prop] = option.css(prop);
    }
    /*
    //Нормальный способ копирования свойств не работает в сифилитичном фаерфоксе.
    Наш добрый друг воспринимает цвет выделенного option, всегда как белый option:checked{} и кладёт болт на стили сайта
    Из-за этого чудесатого свойства чемпиона среди браузеров, нам придётся пилить костыль
    */
    css.color = option.hasClass('select-default')? 'gray': 'black';
	
    el.css(css);
};
