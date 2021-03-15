utils.overrideMethod(Block, 'clearWrp', function __method__(){
    if( this.wrp )
        this.wrp.css('min-height', this.wrp.height()); // Фиксируем текущую высоту врапера, чтобы не прыгал внешний скролл при обновлении контента
    
    __method__.origin.apply(this, arguments);
});

utils.overrideMethod(Block, 'drawIsOver', function __method__(){
    __method__.origin.apply(this, arguments);
    
    if( this.wrp )
        this.wrp.css('min-height', '');
});