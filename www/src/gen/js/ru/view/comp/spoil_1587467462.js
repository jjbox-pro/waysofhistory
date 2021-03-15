
//спойлер для армий, скорее всего пригодится ещё где-нибудь
function Spoil(cont, linkFunk){
    this.cont = cont;
    this.wrpClass = 'spoiler';
    this.linkClass = 'spoiler-open';
    this.linkFunc = linkFunk || function(count){
        return count;
    };
    
    this.bind();
    
    this.prepare();
}

Spoil.prototype.bind = function(){
    var self = this;
    this.cont.on('click', '.'+this.linkClass, function(){
        $(this).parents('.'+self.wrpClass).addClass('-expanded');
    });
};

Spoil.prototype.prepare = function(){
    var self = this;
	
    this.cont.find('.'+this.wrpClass).each(function(){
		utils.getElemSize($(this), {
			callback: function($cont){
				$cont.find('.'+self.linkClass).remove();

				var children = $cont.children(),
					i = children.length - 1,
					child = children.eq(i);

				if( child.length && child.position().top >= $cont.height() ) {
					while (i>0){
						i--;
						
						child = children.eq(i);
						
						if( child.position().top < $cont.height() ) {
							var $link = self.setLink($link, children.length-i);
							
							child.before($link);
							
							while( $link.position().top >= $cont.height() ){
								i--;
								
								child = children.eq(i);
								
								self.setLink($link, children.length-i);
								
								child.before($link);
							}
							
							$link.width($cont.width() - $link.position().left - 2);
							
							break;
						}
					}
				}
			}
		});		
    });
};

Spoil.prototype.setLink = function($link, count){
	$link = $link||$('<a class="link '+this.linkClass+'"></a>');
	
	$link.html(this.linkFunc(count) + '<br>');
	
	return $link;
};
