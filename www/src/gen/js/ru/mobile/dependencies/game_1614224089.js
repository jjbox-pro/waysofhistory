(function(){
	var root = '/gen/js/ru/mobile/',
		opt = {
			async: false,
			callback: function(){
				appl.onDependenciesLoaded();
			}
		};
	
    function loadScripts(scripts){
        for(var script in scripts)
            loadScript(scripts[script]);
    };
    
    function loadScript(url){
        appl.dependencies++;
        
        utils.loadScript(root + url, opt);
    };
    
	loadScripts([
		'lib/m.scrollbar_1608515007.js',
		
		'app/m.util_1593485096.js',
		'app/m.hash_1608532541.js',
        
        'app/m.applgame_1611234442.js',
        
		'app/m.snipet_1611700019.js',
		'app/m.tmpl_1614224088.js',
		'app/m.wndMgr_1611233901.js',
		'app/m.tooltipMgr_1608532543.js',
		'app/m.contentLoader_1608532539.js',
		'app/m.chatMgr_1587467263.js',
		'app/m.ls_1598332979.js',
		
        'view/comp/m.block_1611630850.js',
		'view/comp/m.wnd_1611038878.js',
		'view/comp/m.interface_1586342219.js',
		'view/comp/m.bar_1606030034.js',
		'view/comp/m.panel_1611099632.js',
		
		'view/bar/m.statusBar_1603868708.js',
		'view/bar/m.menuBar_1611039186.js',
		'view/bar/m.navBar_1611039189.js',
		
		'view/inf/m.i.town_1587467288.js',
		'view/inf/m.i.map_1608532555.js',
		
		'view/screen/m.s.town_1610248668.js',
		'view/screen/m.s.map_1608532566.js',
		'view/screen/m.s.noTowns_1587467310.js',
		
		'view/town/m.bckTown_1608532568.js',
		'view/town/m.bckTownOld_1608532571.js',
		'view/town/m.mainmenu_1608532573.js',
		'view/town/m.townClicker_1601340580.js',
		'view/town/m.p.stock_1608532579.js',
		'view/town/m.p.garrison_1608532577.js',
		'view/town/m.p.bldqueue_1608532575.js',
		
		'view/map/m.bckMap_1610238255.js',
		'view/map/m.p.mapR_1608158732.js',
		'view/map/m.b.mapR_1610238253.js',
		'view/map/m.p.mapMini_1606018306.js',
		'view/map/m.b.mapMini_1611458073.js',
		'view/map/m.p.mapActions_1608532564.js',
		'view/map/m.b.mapArrows_1587467290.js',
		'view/map/m.b.mapTL_1603868713.js',
		
		'view/wnd/m.w.all_1610855472.js',
		'view/wnd/m.w.ability_1608532582.js',
		'view/wnd/m.w.army_1587467334.js',
		'view/wnd/m.w.battle_1593062578.js',
		'view/wnd/m.w.bonus_1608532586.js',
		'view/wnd/m.w.chat_1608532588.js',
		'view/wnd/m.w.chest_1603233543.js',
		'view/wnd/m.w.contacts_1587467344.js',
		'view/wnd/m.w.country.adviser_1608532590.js',
		'view/wnd/m.w.country_1608532592.js',
		'view/wnd/m.w.country.makeOrder_1586342295.js',
		'view/wnd/m.w.country.orders_1608532594.js',
		'view/wnd/m.w.countryInfo_1587467353.js',
		'view/wnd/m.w.economics_1612315710.js',
        'view/wnd/m.w.freeLuck_1603176267.js',
		'view/wnd/m.w.help_1611099634.js',
		'view/wnd/m.w.message_1609281244.js',
		'view/wnd/m.w.messages_1611622933.js',
		'view/wnd/m.w.mobileAccept_1603150715.js',
        'view/wnd/m.w.noPremium_1603176270.js',
		'view/wnd/m.w.market_1608532599.js',
		'view/wnd/m.w.options_1608532605.js',
		'view/wnd/m.w.questinfo_1593760208.js',
		'view/wnd/m.w.rate_1608532607.js',
		'view/wnd/m.w.report_1587467372.js',
		'view/wnd/m.w.reports_1611622936.js',
		'view/wnd/m.w.scienceNext_1608532609.js',
		'view/wnd/m.w.send_1611622938.js',
		'view/wnd/m.w.shop_1603176272.js',
		'view/wnd/m.w.simbattle_1608532611.js',
        'view/wnd/m.w.slot_1611043483.js',
		'view/wnd/m.w.slotNew_1586342333.js',
		'view/wnd/m.w.support_1603176274.js',
        'view/wnd/m.w.systmenu_1587467385.js',
		'view/wnd/m.w.tactics_1611622940.js',
		'view/wnd/m.w.towns_1587467389.js',
		'view/wnd/m.w.trade_1587467392.js',
		'view/wnd/m.w.tradersMove_1611038881.js',
		'view/wnd/m.w.visibleTowns_1608532616.js',
		'view/wnd/m.w.wonders_1587467396.js'
	]);
	
	
	if( !appl.useMobileAppScripts )
		return;
	
	root = '/gen/js/ru/mobileApp/';
	
	loadScripts([
        'app/ma.applgame_1608525378.js',
        
		'app/ma.snipet_1612673709.js',
		'app/ma.tmpl_1614224088.js',
		'app/ma.wndMgr_1611011980.js',
		'app/ma.ls_1591254681.js',

		'view/comp/ma.wnd_1611038883.js',
        'view/comp/ma.panel_1608531441.js',
        
		'view/bar/ma.bar.all_1603868728.js',
		'view/bar/ma.screenBar_1610317900.js',
        
        'view/screenPage/ma.screenPage_1611099639.js',
        'view/screenPage/ma.screenPage_luck_1606027531.js',
        'view/screenPage/ma.screenPage_map_1606089353.js',
        'view/screenPage/ma.screenPage_town_1606086735.js',
        'view/screenPage/ma.screenPage_comm_1599016928.js',
        'view/screenPage/ma.screenPage_diff_1598504433.js',
        
		'view/screen/ma.s.town_1611448815.js',
		'view/screen/ma.s.map_1611467607.js',

		'view/wnd/ma.w.all_1608533045.js',
        'view/wnd/ma.w.economics_1612853780.js',
        'view/wnd/ma.w.mapComments_1610238262.js'
	]);
})();