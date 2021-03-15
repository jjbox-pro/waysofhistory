LS.mParams = {
	LandscapeNoPanels: 'LandscapeNoPanels',
	MenuSide: 'MenuSide',
	TradeBlockPos: 'TradeBlockPos',
	PanelExpandPos: 'PanelExpandPos',
	NoNavBar: 'NoNavBar',
	OldTown: 'OldTown',
	SmoothMapScroll: 'SmoothMapScroll',
    WndSwipeTime: 'WndSwipeTime',
    BarAnimTime: 'BarAnimTime',
};

LS.servStorageParams[LS.params.PanelExpandPos] = true;
LS.servStorageParams[LS.params.NoNavBar] = true;
LS.servStorageParams[LS.params.OldTown] = true;

LS.def.Antialiasing = true;

LS.init(ls, LS.mParams);