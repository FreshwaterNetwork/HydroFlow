define(
    [
        "jquery",
        "dojo/text!./config.json",
       "./FlowAppScenarios",
        "esri/layers/FeatureLayer",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/SimpleFillSymbol",
         "esri/symbols/SimpleLineSymbol",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/graphicsUtils",
        "dojo/_base/Color",
        "esri/graphic",
        //"esri/tasks/ClassBreaksDefinition",
        //"esri/tasks/AlgorithmicColorRamp",
        //"esri/tasks/GenerateRendererParameters",
        //"esri/tasks/GenerateRendererTask",
        "esri/dijit/Legend",
        "esri/tasks/locator",
        "esri/geometry/Extent",
         "dijit/TooltipDialog"
    ],

      function ($, config,FlowAppScenario,FeatureLayer, SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol, query, QueryTask, graphicsUtils,
        Color, Graphic, Legend, Locator, Extent, TooltipDialog) {

        var configVals = dojo.eval(config)[0];

        var FlowAppMap =
        {
            defaultToolip: null,
            huc12Tooltip: null,
            navTooltip: null,
            //appLegend:null,
            huc12MouseOver: null,
            catchmentClick: null,
            catchmentGraphic:null,
            navExtent: null,
            navHucs: null,
            navBasinID: null,
            navDisplayName: null,
            //map: null,
            highlightSymbol: new SimpleFillSymbol(
                      {
                          "type": "esriSFS",
                          "style": "esriSFSSolid",
                          "color": [115, 76, 0, 1],
                          "outline": {
                              "type": "esriSLS",
                              "style": "esriSLSSolid",
                              "color": [51,255,255],
                              "width": 2
                          }
                      }
                    ),

            setDefaultMap: function (map) {

                var layerInfos = [];

                var HUC8Info = configVals.layers.HUC8;

                var HUC8Layer = new FeatureLayer(HUC8Info.service,
                    {
                        mode: FeatureLayer.MODE_ONDEMAND,
                        outFields: [HUC8Info.displayName, HUC8Info.basinID],
                        id: HUC8Info.LayerID

                    });

                var symbol = new SimpleFillSymbol(HUC8Info.symbol);

                //HUC8Layer.setDefinitionExpression(HUC8Info.basinID + " like '031800%'");

                //HUC8Layer.setRenderer(new SimpleRenderer({"label":HUC8Info.legendName,"symbol":symbol}));
                HUC8Layer.setRenderer(new SimpleRenderer(symbol));
                map.addLayer(HUC8Layer);

                layerInfos.push({ layer: HUC8Layer, title: HUC8Info.legendName });
                                
                //Add the mouse over 
                HUC8Layer.on("mouse-move", function (evt) {
                    map.graphics.clear();

                    var t = "<div align ='center'>${" + HUC8Info.displayName+"}<br>${" + HUC8Info.basinID + "}</div>";
                    var content = esri.substitute(evt.graphic.attributes, t);
                    //initialize the mouse over tooltip
                    FlowAppMap.defaultTooltip = new TooltipDialog({
                        style: "position: absolute;font: normal normal normal 8pt Helvetica; z-index:100",
                        position: "right"
                    });
                    FlowAppMap.defaultTooltip.startup();
                    FlowAppMap.defaultTooltip.setContent(content);
                    dijit.popup.open({ popup: FlowAppMap.defaultTooltip, x: evt.pageX, y: evt.pageY });

                    //also highlight the polygon
                    var highlightGraphic = new Graphic(evt.graphic.geometry, FlowAppMap.highlightSymbol, evt.graphic.attributes);
                    map.graphics.add(highlightGraphic);


                });

                //add the low res flow lines
                var streamsLowRes = new FeatureLayer(configVals.layers.StreamsLowRes.service,
                {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    id: configVals.layers.StreamsLowRes.LayerID

                });
                streamsLowRes.setMaxScale(200001);
                streamsLowRes.setMinScale(1000000);
                //streamsLowRes.setMinScale(1500000);
                map.addLayer(streamsLowRes);
                layerInfos.push({ layer: streamsLowRes, title: configVals.layers.StreamsLowRes.legendName });

                //add the medium res flow lines
                var streamsMedRes = new FeatureLayer(configVals.layers.StreamsMedRes.service,
                {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    id: configVals.layers.StreamsMedRes.LayerID

                });
                streamsMedRes.setMaxScale(0);
                streamsMedRes.setMinScale(200000);
                map.addLayer(streamsMedRes);
                layerInfos.push({ layer: streamsMedRes, title: configVals.layers.StreamsMedRes.legendName });

                FlowAppMap.refreshLegend(map);

                return HUC8Layer;
                //FlowAppMap.refreshLegend(HUC8Layer,map);
               
            },

           

            setHUC12Map: function (map, HUC8ID) {

                var HUC12Info = configVals.layers.HUC12;

                var HUC12Layer = new FeatureLayer(HUC12Info.service,
                  {
                      mode: FeatureLayer.MODE_ONDEMAND,
                     outFields: ["*"],
                     id: HUC12Info.LayerID
                      

                  });

                HUC12Layer.setRenderer(new SimpleRenderer(new SimpleFillSymbol(HUC12Info.symbol)));
               // HUC12Layer.setRenderer(new SimpleRenderer({ "label": HUC12Info.legendName, "symbol": HUC12Info.symbol }));

                //HUC12Layer.setDefinitionExpression(HUC12Info.basinID + " like '031800%'");
                if (HUC8ID)
                    HUC12Layer.setDefinitionExpression(HUC12Info.basinID + " like '" + HUC8ID + "%'");
                else if (HUC12Info.filterString)
                    HUC12Layer.setDefinitionExpression(HUC12Info.filterString);

                map.addLayer(HUC12Layer);

                //Add the mouse over 
                if (!FlowAppMap.huc12MouseOver) {
                    FlowAppMap.huc12MouseOver = HUC12Layer.on("mouse-move", function (evt) {
                        map.graphics.clear();

                        var t = "<div align ='center'>${" + HUC12Info.displayName + "}<br>${" + HUC12Info.basinID + "}</div>";
                        var content = esri.substitute(evt.graphic.attributes, t);
                        //initialize the mouse over tooltip
                        FlowAppMap.huc12Tooltip = new TooltipDialog({
                            style: "position: absolute;font: normal normal normal 8pt Helvetica; z-index:100",
                            position: "right"
                        });
                        FlowAppMap.huc12Tooltip.startup();
                        FlowAppMap.huc12Tooltip.setContent(content);
                        dijit.popup.open({ popup: FlowAppMap.huc12Tooltip, x: evt.pageX, y: evt.pageY });

                        //also highlight the polygon
                        var highlightGraphic = new Graphic(evt.graphic.geometry, FlowAppMap.highlightSymbol, evt.graphic.attributes);
                        map.graphics.add(highlightGraphic);
                    });
                }
                

               map.graphics.on('mouse-out', function () {
                    FlowAppMap.clearTooltips(map);
                });

                return HUC12Layer;
            },

            displayNavigationResults: function (response,map) {
                
                var NavResultsConfig = configVals.layers.NavigationResults;

                FlowAppMap.map = map;
                FlowAppMap.navHucs = new Array();
                FlowAppMap.navExtent = null;
                FlowAppMap.navBasinID = NavResultsConfig.basinID;
                FlowAppMap.navDisplayName = NavResultsConfig.displayName;



                //Figure our how many HUC's we need to ask for
                var maxCount = 60; //max number of HUC12s we will query for
                var navCount = Math.floor(response.length / maxCount); //number of nav themes we will load
                if (response.length % maxCount > 0)
                    navCount++;

                var counter = 1;
                while (counter <= navCount) {
                    //build a filter string so we can make a new layer
                    var limit = maxCount * counter;
                    if (limit > response.length - 1)
                        limit = response.length - 1;

                    var filterString = NavResultsConfig.basinID + " in ("
                    for (var i = (counter - 1) * maxCount; i <= limit; i++) {
                        filterString += "'" + response[i].feature_id + "',";
                    }
                  
                    filterString = filterString.substring(0, filterString.length - 1) + ")"


                    var NavResultsLayer = new FeatureLayer(NavResultsConfig.service, {

                        mode: FeatureLayer.MODE_ONDEMAND,
                        outFields: ["*"],
                        id: NavResultsConfig.LayerID + "_"+ counter
                    });

                    var symbol = new SimpleFillSymbol(NavResultsConfig.symbol);

                    NavResultsLayer.setDefinitionExpression(filterString);

                    NavResultsLayer.setRenderer(new SimpleRenderer(symbol));
                    //NavResultsLayer.setRenderer(new SimpleRenderer({ "label": NavResultsConfig.layerName, "symbol": symbol }));

                    map.addLayer(NavResultsLayer);
                                       
                        

                    FlowAppMap.addNavigationTooltips(NavResultsLayer, map);

                    
                    //add the HUCs to the drop down array
                    var featureQuery = new query();
                    featureQuery.outFields = ["*"];
                    featureQuery.where = filterString;

                    NavResultsLayer.queryFeatures(featureQuery, FlowAppMap.setNavResults, FlowAppMap.errorHandler)

                    counter++;
                }

                map.graphics.on('mouse-out', function () {
                    FlowAppMap.clearTooltips(map);
                });

                

            },

            setNavResults: function (result) {

               if (!FlowAppMap.navExtent)
                    FlowAppMap.navExtent = graphicsUtils.graphicsExtent(result.features);
               else
                    FlowAppMap.navExtent = FlowAppMap.navExtent.union(graphicsUtils.graphicsExtent(result.features));

               FlowAppMap.map.setExtent(FlowAppMap.navExtent, true); 

                $.each(result.features, function (index, feature) {
                    FlowAppMap.navHucs.push(
                        {
                            value: feature.attributes[FlowAppMap.navBasinID],
                            name: feature.attributes[FlowAppMap.navDisplayName]
                        }
                       )
                });
            },

            addNavigationTooltips: function (NavResultsLayer, map) {

                var NavResultsConfig = configVals.layers.NavigationResults;

                //Add the mouse over 
                NavResultsLayer.on("mouse-move", function (evt) {
                    var t = "<div align ='center'>${" + NavResultsConfig.displayName + "}<br>${" + NavResultsConfig.basinID + "}</div>";
                    var content = esri.substitute(evt.graphic.attributes, t);
                    //initialize the mouse over tooltip
                    FlowAppMap.navTooltip = new Array();

                    var navTooltip = new TooltipDialog({
                        style: "position: absolute;font: normal normal normal 8pt Helvetica; z-index:100",
                        position: "right"
                    });
                    navTooltip.startup();
                    navTooltip.setContent(content);
                    dijit.popup.open({ popup: navTooltip, x: evt.pageX, y: evt.pageY });

                    FlowAppMap.navTooltip.push(navTooltip);

                    //also highlight the polygon
                    var highlightGraphic = new Graphic(evt.graphic.geometry, FlowAppMap.highlightSymbol, evt.graphic.attributes);
                    map.graphics.add(highlightGraphic);

                });

              
            },

            displaySelectedHUC12: function (HUC12ID, map) {

                //build a filter string so we can make a new layer
                var HUC12config = configVals.layers.HUC12;

                var filterString = HUC12config.basinID + " = '" + HUC12ID + "'";
                
                var SelectedHUCLayer = new FeatureLayer(HUC12config.service, {

                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"],
                    id: HUC12config.LayerID + "Selected"
                });

                
                SelectedHUCLayer.setDefinitionExpression(filterString);

                SelectedHUCLayer.setRenderer(new SimpleRenderer(FlowAppMap.highlightSymbol));

                map.addLayer(SelectedHUCLayer);

            },


            refreshLegend: function (map,titleText) {
               
                //title text is only provided when we are classifying HUC12s by metric

                //we want to add all of the Flow app layers to the legend (except multiple nav layers and highlights)

                var layerInfos = [];
                var layerList = map.graphicsLayerIds;
                var layers = configVals.layers;

                var boolTitleText = true;
                var boolNavResults = false;

                if (!titleText)
                    boolTitleText = false;
                else {
                    //loop over layer list to see if we have nav results
                    for (var i = 0; i < layerList.length; i++) {
                        if (layerList[i].indexOf("_1") >= 0) {
                            boolNavResults = true;                           
                        }

                    }
                }
                

                for (var i = 0; i < layerList.length; i++) {

                    if (layerList[i].indexOf("FlowApp") >= 0) {//all layers for the tool have FlowApp in the ID
                        //map.removeLayer(map.getLayer(layerList[i]));
                        if (map.getLayer(layerList[i]))
                        {
                            var currLayer = map.getLayer(layerList[i]);
                            $.each(layers, function (layerKey, item) {
                                if (currLayer.id == item.LayerID) {
                                    if (boolTitleText && !boolNavResults && layerKey == "HUC12")
                                        layerInfos.push({ layer: currLayer, title: titleText });
                                    else
                                        layerInfos.push({ layer: currLayer, title: item.legendName });

                                    return false;
                                }
                                else if (currLayer.id == item.LayerID + "_1") {//this is nav results
                                    if (boolTitleText)
                                        layerInfos.push({ layer: currLayer, title: titleText });
                                    else
                                        layerInfos.push({ layer: currLayer, title: item.legendName });

                                    return false;
                                }
                            })
                        }
                        
                        
                    }
                }

                var appLegend;
                
                if (dijit.byId("divFlowAppLegend")) {
                    var appLegend = dijit.byId("divFlowAppLegend");
                    appLegend.refresh(layerInfos);
                    
                }
                else {
                    appLegend = new Legend({
                        map: map,
                        layerInfos: layerInfos
                    }, divFlowAppLegend);

                    appLegend.startup();
                }

            },


            clearMap: function (map) {

                var layerList = map.graphicsLayerIds;
                for (var i = layerList.length - 1; i >= 0; i--) {

                    if (layerList[i].indexOf("FlowApp") >= 0 && layerList[i].indexOf("Streams") == -1) //all layers for the tool have FlowApp in the ID
                        map.removeLayer(map.getLayer(layerList[i]));

                }

                

                FlowAppMap.clearTooltips(map);



            },

            clearTooltips: function (map) {
                //take care of any tooltips
                if (FlowAppMap.defaultTooltip)
                    dijit.popup.close(FlowAppMap.defaultTooltip);

                if (FlowAppMap.huc12Tooltip)
                    dijit.popup.close(FlowAppMap.huc12Tooltip);

                //if (FlowAppMap.navTooltip)
                //dijit.popup.close(FlowAppMap.navTooltip);
                if (FlowAppMap.navTooltip) {
                    for (var i = 0; i < FlowAppMap.navTooltip.length; i++) {
                        if (FlowAppMap.navTooltip[i])
                            dijit.popup.close(FlowAppMap.navTooltip[i]);
                    }
                  
                }
                

                map.graphics.clear();
            },

            setCatchments: function (map, HUC12ID) {

                var CatchmentInfo = configVals.layers.Catchments;

                if (document.getElementById("ddNavResults")) { //zoom to the HUC12
                    var queryTask = new QueryTask(configVals.layers.HUC12.service);
                    var queryHUC12 = new query();
                    queryHUC12.where = configVals.layers.HUC12.basinID + " ='" + HUC12ID + "'";
                    queryHUC12.returnGeometry = true;
                    queryHUC12.outFields = [configVals.layers.HUC12.basinID];
                    queryTask.execute(queryHUC12,FlowAppMap.zoomToHUC12)

                }

                var catchmentsLayer = new FeatureLayer(CatchmentInfo.service,
                  {
                      mode: FeatureLayer.MODE_ONDEMAND,
                      outFields: ["*"],
                      id: CatchmentInfo.LayerID
                      

                  });

                //catchmentsLayer.setRenderer(new SimpleRenderer({"label":CatchmentInfo.legendName,"symbol":CatchmentInfo.symbol}));   
                catchmentsLayer.setRenderer(new SimpleRenderer(new SimpleFillSymbol(CatchmentInfo.symbol)));
                catchmentsLayer.setDefinitionExpression(CatchmentInfo.basinID + " like '" + HUC12ID + "%'");           

                map.addLayer(catchmentsLayer);

                //Add the catchment click event 
                if (!FlowAppMap.catchmentClick) {
                    FlowAppMap.catchmentClick = catchmentsLayer.on("click", function (evt) {

                        //FlowAppScenario.loadWaitDialog(); //show the wait dialog
                        $("#divCatchments").css("display", "none");
                        $("#divWaitCatchments").css("display", "");
                        $("#divCatchmentScenarios").css("display", "none");

                        if (map.getLayer(CatchmentInfo.LayerID + "Selected"))
                            map.removeLayer(map.getLayer(CatchmentInfo.LayerID + "Selected"));                

                        var selectedCatchment = evt.graphic.attributes;
                       
                        //build a filter string so we can make a new layer

                        var filterString = CatchmentInfo.displayName + " = " + selectedCatchment[CatchmentInfo.displayName];


                        var selectedCatchmentsLayer = new FeatureLayer(CatchmentInfo.service,
                        {
                            mode: FeatureLayer.MODE_ONDEMAND,
                            outFields: ["*"],
                            id: CatchmentInfo.LayerID + "Selected"


                        });


                        selectedCatchmentsLayer.setDefinitionExpression(filterString);

                        selectedCatchmentsLayer.setRenderer(new SimpleRenderer(FlowAppMap.highlightSymbol));

                        map.addLayer(selectedCatchmentsLayer);
                        FlowAppMap.refreshLegend(map);

                        //populate the table
                        var promise = $.ajax({
                            type: "GET",
                            url: configVals.WaterFALLService + "GetSingleMetrics/.jsonp?scenario_name=any&feature_id=" + selectedCatchment[CatchmentInfo.displayName],
                            dataType: 'jsonp'

                        });

                        promise.done(function (results,status,resultsInfo) {
                            FlowAppScenario.loadScenarioMetrics(results, "catchments", selectedCatchment[CatchmentInfo.displayName]);
                        });

                        //failure
                        promise.fail(function (xhr, status, error) {
                            alert("XHR: " + xhr.responseText + " Status: " + status + " Error: " + error);

                        });
                    });
                }
                

             
            },

            removeCatchments: function (map) {

                var catchmentInfo = configVals.layers.Catchments;

                if (map.getLayer(catchmentInfo.LayerID))
                    map.removeLayer(map.getLayer(catchmentInfo.LayerID));

                if (map.getLayer(catchmentInfo.LayerID + "Selected")) {
                    map.removeLayer(map.getLayer(catchmentInfo.LayerID + "Selected"));
                    FlowAppMap.refreshLegend(map);
                }

                if (FlowAppMap.catchmentClick) {
                    FlowAppMap.catchmentClick.remove();
                    FlowAppMap.catchmentClick = null;
                }
                
                $("#divCatchments").css("display", "");
                $("#divCatchmentScenarios").css("display", "none");

            },           

            zoomToHUC12: function (featureSet) {
                //called from a query task that queries HUC12ID
                if (featureSet.features.length > 0) {                 
                    var extent = graphicsUtils.graphicsExtent(featureSet.features);
                    map.setExtent(extent,true);
                }

            },

            errorHandler: function (error) {
                alert("An error has occurred.");
            }
        }
          return FlowAppMap;

      }
  )