define(
    [
        "jquery",
        "./jquery.flot",
        "./jquery-ui.min",
         "./FlowAppMap",
         "./FlowAppChart",
         "./FlowAppScenarios",
          "dojo/text!../../region.json",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/SimpleFillSymbol",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/graphicsUtils",
        "dojo/_base/Color",
        "esri/graphic",
        "esri/tasks/ClassBreaksDefinition",
        "esri/tasks/AlgorithmicColorRamp",
        "esri/tasks/GenerateRendererParameters",
        "esri/tasks/GenerateRendererTask",
        "esri/dijit/Legend",
        "esri/tasks/locator",
        "esri/geometry/Extent",
        "esri/SpatialReference",
         "dijit/TooltipDialog"

    ],
    function ($, plot, ui, FlowAppMap,FlowAppChart,FlowAppScenario,regionConfig,SimpleRenderer, SimpleFillSymbol, query, QueryTask, graphicsUtils,
        Color, Graphic, ClassBreaksDefinition,AlgorithmicColorRamp,GenerateRendererParameters,GenerateRendererTask,Legend,Locator,Extent,SpatialReference,TooltipDialog) {

        

        var FlowAppUtil =
        {
            metricConfig: null,           
            container: null,
            templates: null,
            configVals: null,
            map: null,            
            huc8Click: null,
            huc12Click: null,
            //appLegend: null,
            addressLocator: null,
            locationGraphic: null, //this is the icon used to display the user entered location
            appState: {
                HUC8ID: null,
                HUC8Extent: null,
                HUC8Name: null,
                HUC12Name: null,
                HUC12ID:null
            },
            waitDialog:null,

            setReferences: function (container, legendContainer, templates, configVals, map) {
               
                FlowAppUtil.container = container;
                FlowAppUtil.templates = templates;
                FlowAppUtil.configVals = configVals;
                FlowAppUtil.map = map;

                FlowAppUtil.addressLocator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
                FlowAppUtil.addressLocator.on("address-to-locations-complete", FlowAppUtil.showLocationResults);

                //Create the legend
                //make a div for the legend
                var placeholder = $('<div>');
                $(placeholder).attr("id", "divFlowAppLegend");
                $(legendContainer).append(placeholder);

                    

            },

            setMetrics: function () {
               
                if (!FlowAppUtil.metricConfig) {
                    $.ajax({
                        type: "GET",
                        url: "plugins/flow_app/metrics.json",
                        async: false,
                        beforeSend: function (x) {
                            x.overrideMimeType("application/j-son;charset=UTF-8");

                        },
                        dataType: "json",
                        success: function (data) {
                            FlowAppUtil.metricConfig = data[0];
                        }
                    });
                }
                
            },

            setDefaultView: function () {                

                //reset variables if we've got them
                FlowAppUtil.appState.HUC12Name = null;
                FlowAppUtil.appState.HUC12ID = null;
                FlowAppUtil.appState.HUC8ID = null;
                FlowAppUtil.appState.HUC8Name = null;

                if (FlowAppUtil.huc12Click) {
                    FlowAppUtil.huc12Click.remove();
                    FlowAppUtil.huc12Click = null;
                }

                if (FlowAppMap.huc12MouseOver) {
                    FlowAppMap.huc12MouseOver.remove();
                    FlowAppMap.huc12MouseOver = null;
                }
                   

                $(FlowAppUtil.container).html($.trim($(FlowAppUtil.templates).find("#template-flowApp-landing").html()));

                if (!($._data(document.getElementById("btnShowAll"), "events")))
                    $("#btnShowAll").click(FlowAppUtil.showHUC12s);

                if (!($._data(document.getElementById("btnFindLocation"), "events")))
                    $("#btnFindLocation").click(FlowAppUtil.findLocation);

                var HUC8Info = FlowAppUtil.configVals.layers.HUC8;

                var HUC8Layer = FlowAppMap.setDefaultMap(FlowAppUtil.map);
                               

                //on map click
                FlowAppUtil.huc8Click = FlowAppUtil.map.graphics.on("click", function (evt) {

                    //selectedHUC is the attributes from the seleceted HUC
                    var selectedHUC = evt.graphic.attributes;
                    FlowAppUtil.appState.HUC8ID = selectedHUC[HUC8Info.basinID];
                    FlowAppUtil.appState.HUC8Name = selectedHUC[HUC8Info.displayName];

                    var extent = graphicsUtils.graphicsExtent([evt.graphic]);
                    FlowAppUtil.appState.HUC8Extent = extent;
                    
                    FlowAppUtil.showHUC12s();

                });

                FlowAppUtil.map.graphics.on('mouse-out',function(){
                    FlowAppMap.clearTooltips(FlowAppUtil.map);
                });
            

            },

            showHUC12s: function () {


                //remove whatever else is going on in the map
                FlowAppMap.clearMap(FlowAppUtil.map);
                if (FlowAppUtil.huc8Click)
                {
                    FlowAppUtil.huc8Click.remove();
                    FlowAppUtil.huc8Click = null;
                }
                FlowAppUtil.appState.HUC12ID = null;
                FlowAppUtil.appState.HUC12Name = null;

                $(FlowAppUtil.container).html($.trim($(FlowAppUtil.templates).find("#template-flowApp-huc12s").html()));
               

                $("#spanHUC8Name").html(FlowAppUtil.appState.HUC8Name + " (" + FlowAppUtil.appState.HUC8ID + ")");

                if (!($._data(document.getElementById("btnStartOver"), "events")))
                    $("#btnStartOver").click(FlowAppUtil.startOver);

                FlowAppUtil.populateSingleMetricDropDown();

                if (!($._data(document.getElementById("ddSingleMetric"), "events")))
                    $("#ddSingleMetric").change(FlowAppUtil.classifyByMetric);

                //add the HUC 12 layer to the map
                var HUC12Layer = FlowAppMap.setHUC12Map(FlowAppUtil.map, FlowAppUtil.appState.HUC8ID);
                FlowAppMap.refreshLegend(FlowAppUtil.map);

                if (FlowAppUtil.appState.HUC8Extent)
                    FlowAppUtil.map.setExtent(FlowAppUtil.appState.HUC8Extent,true);
             
                //on click
                if (!FlowAppUtil.huc12Click) {
                    FlowAppUtil.huc12Click = FlowAppUtil.map.graphics.on("click", function (evt) {

                        //selectedHUC is the attributes from the seleceted HUC
                        var selectedHUC = evt.graphic.attributes;

                        FlowAppUtil.appState.HUC12Name = selectedHUC[FlowAppUtil.configVals.layers.HUC12.displayName];
                        FlowAppUtil.appState.HUC12ID = selectedHUC[FlowAppUtil.configVals.layers.HUC12.basinID];
                        FlowAppUtil.setMetrics();

                        var extent = graphicsUtils.graphicsExtent([evt.graphic]);
                        FlowAppUtil.map.setExtent(extent, true);


                        if (FlowAppMap.huc12MouseOver) {
                            FlowAppMap.huc12MouseOver.remove();
                            FlowAppMap.huc12MouseOver = null;
                        }                     

                        //update Display
                        FlowAppUtil.setHUC12Metrics();
                        FlowAppUtil.classifyByMetric();//reset the huc12 layer

                        FlowAppMap.displaySelectedHUC12(FlowAppUtil.appState.HUC12ID,FlowAppUtil.map);

                    });
                }
               
                
                
            },

            
            setHUCNavigateView: function () {
                //shows the navigation form and wires up the form objects
                FlowAppMap.removeCatchments(FlowAppUtil.map, FlowAppUtil.configVals.layers.Catchments);
                $(FlowAppUtil.container).html($.trim($(FlowAppUtil.templates).find("#template-flowApp-HUC12Navigate").html()));
                $("#fldNavOptions").width(0.85 * FlowAppUtil.configVals.dialogWidth);
                $("#spanHUC8Name").html(FlowAppUtil.appState.HUC8Name + " (" + FlowAppUtil.appState.HUC8ID + ")");
                $("#spanHUC12Name").html(FlowAppUtil.appState.HUC12Name + " (" + FlowAppUtil.appState.HUC12ID + ")");

                if (!($._data(document.getElementById("btnClearHUC12"), "events")))
                    $("#btnClearHUC12").click(FlowAppUtil.showHUC12s);

                if (!($._data(document.getElementById("radView"), "events"))) 
                    $("#radView").click(FlowAppUtil.setHUC12Metrics);                

                $("#btnNavigation", "#btnStartOver", "#btnClearHUC12").button();

                if (!($._data(document.getElementById("btnNavigation"), "events")))
                    $("#btnNavigation").click(FlowAppUtil.navigate);

                if (!($._data(document.getElementById("btnStartOver"), "events")))
                    $("#btnStartOver").click(FlowAppUtil.startOver);

                if (!($._data(document.getElementById("btnClearHUC12"), "events")))
                    $("#btnClearHUC12").click(FlowAppUtil.showHUC12s);

                if (!($._data(document.getElementById("radTime"), "events")))
                    $("#radTime").click(function () { $("#spanLimitLabel").html("(hrs)"); });

                if (!($._data(document.getElementById("radDistanceKm"), "events")))
                    $("#radDistanceKm").click(function () { $("#spanLimitLabel").html("(km)"); });

                if (!($._data(document.getElementById("radDistanceMi"), "events")))
                    $("#radDistanceMi").click(function () { $("#spanLimitLabel").html("(mi)"); });

            },

            setHUC12Metrics: function(){
                $(FlowAppUtil.container).html($.trim($(FlowAppUtil.templates).find("#template-flowApp-HUC12Selected").html()));
                $("#spanHUC8Name").html(FlowAppUtil.appState.HUC8Name + " (" + FlowAppUtil.appState.HUC8ID + ")");
                $("#spanHUC12Name").html(FlowAppUtil.appState.HUC12Name + " (" + FlowAppUtil.appState.HUC12ID + ")");
                $("#hidHUC12ID").val(FlowAppUtil.appState.HUC12ID);

                if (!($._data(document.getElementById("radHUC12Navigate"), "events")))
                    $("#radHUC12Navigate").click(FlowAppUtil.setHUCNavigateView);

                if(!($._data(document.getElementById("btnClearHUC12"), "events")))
                    $("#btnClearHUC12").click(FlowAppUtil.showHUC12s);

                if (!($._data(document.getElementById("btnStartOver"), "events")))
                    $("#btnStartOver").click(FlowAppUtil.startOver);

                if (!($._data(document.getElementById("radScenarios"),"events")))
                    $("#radScenarios").click(FlowAppUtil.setScenarios);

                if (!($._data(document.getElementById("radCurrent"), "events")))
                    $("#radCurrent").click(FlowAppUtil.showCurrentMetrics);

                FlowAppUtil.loadTabs();

            
            },

            loadTabs: function () {
                $("#divTabs").tabs({
                    activate: function (event, ui) {               
                        if (ui.newTab.index() == 1) { //this is the time series tab
                            FlowAppChart.addChart(FlowAppUtil.metricConfig);
                        }
                        else if (ui.newTab.index() == 3) {
                            
                            var HUC12 = FlowAppUtil.appState.HUC12ID;

                            if (document.getElementById("ddNavResults"))
                                HUC12 = $("#ddNavResults").val();

                            FlowAppMap.setCatchments(FlowAppUtil.map, HUC12);
                        }

                        //remove catchments 
                        if (ui.newTab.index() != 3) {
                            FlowAppMap.removeCatchments(FlowAppUtil.map);                         
                                
                        }
                    }
                });

                $("#progressbar").progressbar({
                    value: false
                });

                $("#catchmentsprogressbar").progressbar({
                    value: false
                });

                FlowAppUtil.populateSingleMetrics();
                FlowAppUtil.loadEcochange();
             
            },           

            populateSingleMetrics: function () {
                //query the feature layer for the HUC12 code


                var HUC12 = FlowAppUtil.appState.HUC12ID;             

                if (document.getElementById("ddNavResults"))
                    HUC12 = $("#ddNavResults").val();

              
                $("#imgHydrograph").attr("src", FlowAppUtil.configVals.hydrographPath + HUC12 + ".png");

                var promise = $.ajax({
                    type: "GET",
                    url: FlowAppChart.configVals.WaterFALLService + "GetSingleMetrics/.jsonp?scenario_name=Baseline&feature_id=" + HUC12,
                    dataType: 'jsonp'

                });

                promise.done(FlowAppUtil.loadSingleMetrics);

                //failure
                promise.fail(function (xhr, status, error) {
                    alert("XHR: " + xhr.responseText + " Status: " + status + " Error: " + error);

                });

            },

            loadSingleMetrics: function (singleMetrics) {
                
                $.each(singleMetrics, function () {
                    $("#td" + this.metric_id).html(this.metric_value);
                })

                if (!$("#radScenarios").is(":checked")) {
                    $("#divCurrent").css("display", "");
                    $("#divWaitSingle").css("display", "none")
                }
               
            },

            loadEcochange: function () {
                //$("#imgHydrograph").attr("src", FlowAppUtil.configVals.hydrographPath + HUC12 + ".png");

                //add the scenarion options to the drop down list
                var ddEcoScenario = $("#ddEcoScenario");
                if ($("#ddEcoScenario option").size() == 0)
                {
                    for (var i = 2; i <= 4; i++){
                        ddEcoScenario.append($("<option/>").val(i.toString()).text(FlowAppUtil.metricConfig.scenarios[i].displayName));
                    }
                }
               

                $(ddEcoScenario).val("2");
                FlowAppUtil.populateEcochange();
                

                if (!($._data(document.getElementById("ddEcoScenario"), "events"))) {
                    ddEcoScenario.change(function () {
                        FlowAppUtil.populateEcochange();
                    })
                }
            },

            populateEcochange: function () {

                var HUC12 = FlowAppUtil.appState.HUC12ID;

                if (document.getElementById("ddNavResults"))
                    HUC12 = $("#ddNavResults").val();

                $("#imgEcochange").attr("src", FlowAppUtil.configVals.ecochangePath + HUC12 + "_" + FlowAppUtil.metricConfig.scenarios[$("#ddEcoScenario").val()].graphicCode + ".png");
                //get the values from the service

                var surplus = $.ajax({
                    type: "GET",
                    url: FlowAppUtil.configVals.WaterFALLService + "GetMetric/.jsonp?metric_id=" + FlowAppUtil.metricConfig.ecochange.surplus.id + "&feature_id=" + HUC12,
                    dataType: 'jsonp'

                });

                surplus.done(function (results) {
                    //we need to loop over the results and find the one for the current scenario
                    $.each(results, function (i, item) {
                        if (item.scenario_type_name == FlowAppUtil.metricConfig.scenarios[$("#ddEcoScenario").val()].scenarioName) {
                            //this is the one
                            $("#spanEcosurplus").html(item.metric_value);
                            return false; //exit each
                        }
                    });
                });

                //failure
                surplus.fail(function (xhr, status, error) {
                    alert("XHR: " + xhr.responseText + " Status: " + status + " Error: " + error);
                });

                var deficit = $.ajax({
                    type: "GET",
                    url: FlowAppUtil.configVals.WaterFALLService + "GetMetric/.jsonp?metric_id=" + FlowAppUtil.metricConfig.ecochange.deficit.id + "&feature_id=" + HUC12,
                    dataType: 'jsonp'

                });

                deficit.done(function (results) {
                    //we need to loop over the results and find the one for the current scenario
                    $.each(results, function (i, item) {
                        if (item.scenario_type_name == FlowAppUtil.metricConfig.scenarios[$("#ddEcoScenario").val()].scenarioName) {
                            //this is the one
                            $("#spanEcodeficit").html(item.metric_value);
                            return false; //exit each
                        }
                    });
                });

                //failure
                deficit.fail(function (xhr, status, error) {
                    alert("XHR: " + xhr.responseText + " Status: " + status + " Error: " + error);
                });

            },
          
            navigate: function () {

                FlowAppMap.clearTooltips(FlowAppUtil.map);
                if (FlowAppMap.huc12MouseOver) {
                    FlowAppMap.huc12MouseOver.remove();
                    FlowAppMap.huc12MouseOver = null;
                }
                
                if (FlowAppUtil.huc12Click) {
                    FlowAppUtil.huc12Click.remove();
                    FlowAppUtil.huc12Click = null;
                }


                //check the navigation inputs and call the service
                var boolProceed = true;

                var limit = $("#txtLimit").val().trim();
                if (limit == "") {
                    alert("Please enter a whole number value for limit.");
                    boolProceed = false;
                }
                else {
                    if (isNaN(parseInt(limit))) {
                        alert("Please enter a whole number value for limit.");
                        boolProceed = false;
                    }
                }

                if (boolProceed) {
                    var direction = "upstream";
                    if ($("#radDownstream").is(":checked"))
                        direction = "downstream";

                    var limitType = "dist";
                    if ($("#radTime").is(":checked"))
                        limitType = "time";
                    else { //if we have distance in miles, we need to convert to kilometers
                        if ($("#radDistanceMi").is(":checked"))
                            limit = (parseFloat(limit) / 0.6214).toString();
                    }

                    FlowAppUtil.getNavigationResults(direction,limit,limitType)
                }
                
            },
            getNavigationResults: function (direction,limit,limitType) {

                var limitString = ""
                if (limitType == "time")
                    limitString = "&time=" + limit;
                else
                    limitString = "&dist=" + limit;

                var promise = $.ajax({
                    type: "GET",
                    url: FlowAppUtil.configVals.WaterFALLService+"Navigate/.jsonp?direction=" +direction + "&feature_type=huc12&feature_id=" + FlowAppUtil.appState.HUC12ID + limitString ,
                    dataType: 'jsonp'

                });

                promise.done(FlowAppUtil.displayNavigationResults);

                //failure
                promise.fail(function (xhr, status, error) {
                    alert("XHR: " + xhr.responseText + " Status: " + status + " Error: " + error);

                });
            },

            displayNavigationResults: function (response) {
                
                FlowAppMap.displayNavigationResults(response, FlowAppUtil.map);
                               
                FlowAppUtil.showNavResultsMap();
                FlowAppMap.refreshLegend(FlowAppUtil.map);

            },

            

            showNavResultsMap: function () {
                $(FlowAppUtil.container).html($.trim($(FlowAppUtil.templates).find("#template-flowApp-NavResultsMap").html()));
                $("#spanHUC8Name").html(FlowAppUtil.appState.HUC8Name + " (" + FlowAppUtil.appState.HUC8ID + ")");
                $("#spanHUC12Name").html(FlowAppUtil.appState.HUC12Name + " (" + FlowAppUtil.appState.HUC12ID + ")");

                if (!($._data(document.getElementById("radHUC12"), "events")))
                    $("#radHUC12").click(FlowAppUtil.showNavHuc12s);

                if (!($._data(document.getElementById("btnClearNavigation"), "events")))
                    $("#btnClearNavigation").click(FlowAppUtil.clearNavResults);

                if (!($._data(document.getElementById("btnStartOver"), "events")))
                    $("#btnStartOver").click(FlowAppUtil.startOver);

                //populate the single metric drop down
                FlowAppUtil.populateSingleMetricDropDown();
                if (!($._data(document.getElementById("ddSingleMetric"), "events")))
                    $("#ddSingleMetric").change(FlowAppUtil.classifyByMetric);
            },

            showNavHuc12s: function () {
                

                $(FlowAppUtil.container).html($.trim($(FlowAppUtil.templates).find("#template-flowApp-NavResultsHUC12s").html()));
                $("#spanHUC8Name").html(FlowAppUtil.appState.HUC8Name + " (" + FlowAppUtil.appState.HUC8ID + ")");
                if (!($._data(document.getElementById("radMap"), "events")))
                    $("#radMap").click(FlowAppUtil.showNavResultsMap);

                if (!($._data(document.getElementById("btnClearNavigation"), "events")))
                    $("#btnClearNavigation").click(FlowAppUtil.clearNavResults);

                if (!($._data(document.getElementById("btnStartOver"), "events")))
                    $("#btnStartOver").click(FlowAppUtil.startOver);

                if (!($._data(document.getElementById("radScenarios"), "events")))
                    $("#radScenarios").click(FlowAppUtil.setScenarios);

                if (!($._data(document.getElementById("radCurrent"), "events")))
                    $("#radCurrent").click(FlowAppUtil.showCurrentMetrics);

                //populate the nav results drop down list
                var ddNavResults = $("#ddNavResults");
                $.each(FlowAppMap.navHucs, function (i,item) {
                    ddNavResults.append($("<option/>").val(item.value).text(item.name + " (" +  item.value +")"));
                })

                if (!($._data(document.getElementById("ddNavResults"), "events"))) {
                    ddNavResults.change(function () {
                        //set up for scenarios here
                        FlowAppChart.getTimeSeriesData();
                        FlowAppUtil.populateSingleMetrics();
                        FlowAppUtil.populateEcochange();
                        if ($("#radScenarios").is(":checked")) {
                            $("#divScenarios").css("display", "none");
                            FlowAppUtil.setScenarios();
                        }
                        
                       

                        //see if we need to update the catchments
                        if ($("#divTabs").tabs("option", "active") == "3") {
                            FlowAppMap.removeCatchments(FlowAppUtil.map);
                           
                            FlowAppMap.setCatchments(FlowAppUtil.map, $(ddNavResults).val());
                        }


                    });
                }

                //clear any nav classification
                FlowAppUtil.classifyByMetric();
                    
                FlowAppUtil.loadTabs();

            },


            clearNavResults: function () {

                //set the zoom back to the HUC 12
                
                var queryTask = new QueryTask(FlowAppUtil.configVals.layers.HUC12.service);
                var queryHUC12 = new query();
                queryHUC12.where = FlowAppUtil.configVals.layers.HUC12.basinID + " ='" + FlowAppUtil.appState.HUC12ID + "'";
                queryHUC12.returnGeometry = true;
                queryHUC12.outFields = [FlowAppUtil.configVals.layers.HUC12.basinID];
                queryTask.execute(queryHUC12, FlowAppMap.zoomToHUC12)

                

                var NavResultsConfig = FlowAppUtil.configVals.layers.NavigationResults;

                var layerList = FlowAppUtil.map.graphicsLayerIds;
                for (var i = layerList.length - 1; i >= 0; i--) { //remove the nav results - these can be in more than one layer

                    if (layerList[i].indexOf(NavResultsConfig.LayerID) >= 0) 
                        FlowAppUtil.map.removeLayer(FlowAppUtil.map.getLayer(layerList[i]));                   

                }

                FlowAppMap.removeCatchments(FlowAppUtil.map, FlowAppUtil.configVals.layers.Catchments);
                FlowAppMap.refreshLegend(FlowAppUtil.map);

                if ($("#ddNavResults"))
                    $("#ddNavResults").html(null);

                if (dijit.byId("divFlowAppLegend"))
                    dijit.byId("divFlowAppLegend").refresh();

                FlowAppUtil.setHUC12Metrics();

            },

            
            populateSingleMetricDropDown: function(){
                //populate the single metrics drop down list
                FlowAppUtil.setMetrics();
                var singleMetricOptions = "<option value = ''></option>";

                $.each(FlowAppUtil.metricConfig.single_metrics, function () {
                    singleMetricOptions += "<option value='" + this.fld + "'>" + this.shortName;
                    if (this.units)
                        singleMetricOptions += " (" + this.units + ")";

                    singleMetricOptions += "</option>";
                })

                $("#ddSingleMetric").append($(singleMetricOptions));
            },

          
           

            startOver: function () {
                FlowAppMap.clearMap(FlowAppUtil.map);
                FlowAppUtil.setDefaultView();


                var regionCoords = $.parseJSON(regionConfig).initialExtent;
                var regionExtent = new Extent(regionCoords[0], regionCoords[1], regionCoords[2], regionCoords[3],  new SpatialReference({ wkid: 4326 /*lat-long*/ }));
                FlowAppUtil.map.setExtent(regionExtent);


            },

            clearState: function () {
                FlowAppUtil.HUC8ID = null;
            },

            classifyByMetric: function () {

                var fldName = "";
                FlowAppMap.clearTooltips(FlowAppUtil.map);

                if (document.getElementById("ddSingleMetric")) {
                    fldName = $("#ddSingleMetric").val();
                }
                   
               

                var boolNavResults = false;
                if (document.getElementById("radMap"))
                    boolNavResults = true;

                var symbol;
                var titleText;
               
                if (boolNavResults) {
                    symbol = new SimpleFillSymbol(FlowAppUtil.configVals.layers.NavigationResults.symbol);
                    titleText = FlowAppUtil.configVals.layers.NavigationResults.legendName;
                    if (fldName != "")
                        fldName = FlowAppUtil.configVals.layers.NavigationResults.metricPrefix + fldName;
                }
                else {
                    symbol = new SimpleFillSymbol(FlowAppUtil.configVals.layers.HUC12.symbol);
                    titleText = FlowAppUtil.configVals.layers.HUC12.legendName;
                    if (fldName != "")
                        fldName = FlowAppUtil.configVals.layers.HUC12.metricPrefix + fldName;
                }

                

                if (fldName != "") {

                                       
                    var classDef = new ClassBreaksDefinition();
                    classDef.classificationField = fldName;
                    classDef.classificationMethod = "quantile";
                    classDef.breakCount = 5;

                    var colorRamp = new AlgorithmicColorRamp();
                    colorRamp.fromColor = new Color.fromHex("#998ec3");
                    colorRamp.toColor = new Color.fromHex("#f1a340");
                    colorRamp.algorithm = "hsv";

                    classDef.baseSymbol = new SimpleFillSymbol(FlowAppUtil.configVals.layers.HUC12.symbol);
                    classDef.colorRamp = colorRamp;

                    var params = new GenerateRendererParameters();
                    params.classificationDefinition = classDef;

                    var generateRenderer;
                   
                    if (boolNavResults) //this is navigation results
                        generateRenderer = new GenerateRendererTask(FlowAppUtil.configVals.layers.NavigationResults.service);                       
                    else
                        generateRenderer = new GenerateRendererTask(FlowAppUtil.configVals.layers.HUC12.service);

                    generateRenderer.execute(params, FlowAppUtil.applyRenderer, FlowAppUtil.errorHandler); 
                    
                }
                else {
                    var currLayer;
                    if (boolNavResults) {
                        //loop over each of the nav layers 
                        var layerList = FlowAppUtil.map.graphicsLayerIds;
                        for (var i = layerList.length - 1; i >= 0; i--) {

                            if (layerList[i].indexOf(FlowAppUtil.configVals.layers.NavigationResults.LayerID) >= 0) {  //all nav layers will have this
                                currLayer = FlowAppUtil.map.getLayer(layerList[i]);
                                currLayer.setRenderer(new SimpleRenderer(symbol));
                                //currLayer.setRenderer(new SimpleRenderer({ "legend": FlowAppUtil.configVals.layers.NavigationResults.legendName,"symbol":symbol}))
                                currLayer.redraw();
                            }
                        }
                       
                    }                        
                    else{
                        currLayer = FlowAppUtil.map.getLayer(FlowAppUtil.configVals.layers.HUC12.LayerID);
                        currLayer.setRenderer(new SimpleRenderer(symbol));
                        //currLayer.setRenderer(new SimpleRenderer({ "legend": FlowAppUtil.configVals.layers.NavigationResults.legendName, "symbol": symbol }))
                        currLayer.redraw();
                    }
                    

                  FlowAppMap.refreshLegend(FlowAppUtil.map);
                }
            },

            applyRenderer: function (renderer) {
                
                //need to get the HUC12 Layer in the map
                var boolNavResults = false;
                if (document.getElementById("radMap"))
                    boolNavResults = true;

                var currLayer;

                if (boolNavResults){
                    //loop over each of the nav layers 
                    var layerList = FlowAppUtil.map.graphicsLayerIds;
                    for (var i = layerList.length - 1; i >= 0; i--) {

                        if (layerList[i].indexOf(FlowAppUtil.configVals.layers.NavigationResults.LayerID) >= 0) {  //all nav layers will have this
                            currLayer = FlowAppUtil.map.getLayer(layerList[i]);
                            currLayer.setRenderer(renderer);
                            currLayer.redraw();
                        }
                    }                   
                }
            else{
                currLayer = FlowAppUtil.map.getLayer(FlowAppUtil.configVals.layers.HUC12.LayerID);
                currLayer.setRenderer(renderer);
                currLayer.redraw();
               }
                    

                var metricFld = $("#ddSingleMetric").val();
                var lstSingleMetrics = FlowAppUtil.metricConfig.single_metrics;
                var titleText = "";
                $.each(lstSingleMetrics, function () {
                    if (this.fld == metricFld) {
                        titleText = this.shortName;
                        if (this.units) {
                            titleText += " (" + this.units + ")";
                            return false; //exit loop
                        }

                    }
                });

                
                FlowAppMap.refreshLegend(FlowAppUtil.map,titleText);

            },

            errorHandler: function (error) {
                alert("An error has occurred.");
            },

           

            findLocation: function () {
                var inputAddress = $("#txtLocation").val().trim();
                if (inputAddress == "") {
                    alert("Please enter a location.");
                    return;
                }

                FlowAppUtil.addressLocator.outSpatialReference = FlowAppUtil.map.SpatialReference;
                var options = { address: {"SingleLine":inputAddress}, outFields: ["Loc_name"] };
                FlowAppUtil.addressLocator.addressToLocations(options);
                

            },

            showLocationResults: function (candidates) {

                var geom;
               
                var symbol = new esri.symbol.PictureMarkerSymbol({ "angle": 0, "xoffset": 2, "yoffset": 8, "type": "esriPMS", "url": "http://static.arcgis.com/images/Symbols/Basic/RedShinyPin.png", "contentType": "image/png", "width": 24, "height": 24 });
                $.each(candidates.addresses, function () {
                    //console.log(candidate.score);
                    if (this.score > 80) {
                        //console.log(candidate.location);
                        var attributes = { address: this.address, score: this.score, locatorName: this.attributes.Loc_name };
                        geom = this.location;
                       
                        FlowAppUtil.locationGraphic = new esri.Graphic(geom, symbol, attributes);
                       
                       
                        return false;
                        //break out of loop after one candidate with score greater  than 80 is found.          
                    }
                });

                if (geom !== undefined) {
                    //FlowAppUtil.map.centerAndZoom(geom, 12);
                    //use the point to select the HUC8 and zoom to that 
                    var qryTask = new QueryTask(FlowAppUtil.configVals.layers.HUC8.service);
                    var queryLocation = new query();
                    queryLocation.returnGeometry = true;
                    queryLocation.outFields = ["*"];
                    queryLocation.geometry = geom;
                    qryTask.execute(queryLocation, FlowAppUtil.zoomToLocation, FlowAppUtil.errorHandler);


                }
                else
                    alert("The address entered was not found.");
            },

            zoomToLocation: function (featureSet) {
                if (featureSet.features.length > 0)
                {

                    var selHUCID = featureSet.features[0].attributes[FlowAppUtil.configVals.layers.HUC8.basinID];
                  
                    var extent = graphicsUtils.graphicsExtent(featureSet.features);
                    FlowAppUtil.appState.HUC8Extent = extent;
                    FlowAppUtil.appState.HUC8ID = featureSet.features[0].attributes[FlowAppUtil.configVals.layers.HUC8.basinID];
                    FlowAppUtil.appState.HUC8Name = featureSet.features[0].attributes[FlowAppUtil.configVals.layers.HUC8.displayName];
                    FlowAppUtil.showHUC12s();
                    
                }

                //add a graphic to the map at the geocoded location            
                FlowAppUtil.map.graphics.add(FlowAppUtil.locationGraphic);
            },

            clearMap: function () {
                if (FlowAppUtil.map) {
                    FlowAppMap.clearMap(FlowAppUtil.map);

                    //clean up the legend
                    if (dijit.byId("divFlowAppLegend"))
                        dijit.byId("divFlowAppLegend").destroy();

                   
                }
                   
            },

            clearStreams: function () {
                if (FlowAppUtil.map) {
                    if (FlowAppUtil.map.getLayer(FlowAppUtil.configVals.layers.StreamsLowRes.LayerID))
                        FlowAppUtil.map.removeLayer(FlowAppUtil.map.getLayer(FlowAppUtil.configVals.layers.StreamsLowRes.LayerID));

                    if (FlowAppUtil.map.getLayer(FlowAppUtil.configVals.layers.StreamsMedRes.LayerID))
                        FlowAppUtil.map.removeLayer(FlowAppUtil.map.getLayer(FlowAppUtil.configVals.layers.StreamsMedRes.LayerID));
                }
                
            },

            setScenarios: function () {
               
                
                

                var HUC12 = FlowAppUtil.appState.HUC12ID;

                if (document.getElementById("ddNavResults"))
                    HUC12 = $("#ddNavResults").val();
                
                $("#divCurrent").css("display","none");
                $("#divWaitSingle").css("display", "");
                

                //populate the table
                var promise = $.ajax({
                    type: "GET",
                    url: FlowAppChart.configVals.WaterFALLService + "GetSingleMetrics/.jsonp?scenario_name=any&feature_id=" + HUC12,
                    dataType: 'jsonp'

                });

                promise.done(function (results, status, resultsInfo) {
                    FlowAppScenario.loadScenarioMetrics(results, "HUC12");
                });

                //failure
                promise.fail(function (xhr, status, error) {
                    alert("XHR: " + xhr.responseText + " Status: " + status + " Error: " + error);

                });


            },

           
            showCurrentMetrics: function () {
                $("#divCurrent").css("display", "");
                $("#divScenarios").css("display", "none");
            }
            
        }
        return FlowAppUtil;
        
    }
  )

