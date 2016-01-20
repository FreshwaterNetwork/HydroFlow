define(
    [
        "jquery",
        "./jquery.flot",
        "dojo/text!./config.json",
        "dojo/text!./metrics.json"
        
    ],
    function ($, plot,config,metrics) {        

        var FlowAppChart =
        {
            configVals: dojo.eval(config)[0],
            metricConfig:dojo.eval(metrics)[0],

            previous_point:null,
            previous_label: null,
            container:null,

            addChart: function (metricConfig,container) {

                FlowAppChart.container = container;
                var optionCount = $("#ddTimeSeriesMetrics option").size();

                //see if we are dealing navigation results
                var boolNavResults = false;
                if (document.getElementById("radMap"))
                    boolNavResults = true;
                                         
                if (!boolNavResults && optionCount > 0) //we can exit this, the chart should already be there
                    return


                if (optionCount == 0)
                {
                    //populate the drop down list
                    var timeSeriesOptions = "";

                    $.each(metricConfig.time_series, function () {
                        timeSeriesOptions += "<option value='" + this.id + "'>" + this.shortName;
                        if (this.units)
                            timeSeriesOptions += " (" + this.units + ")";

                        timeSeriesOptions += "</option>";
                    })

                    $("#ddTimeSeriesMetrics").append($(timeSeriesOptions));
                }
               
               

                //make a div for the charts 
                var chartDiv = $("#divChart");
                $(chartDiv).html(null);

                $("#ddTimeSeriesMetrics").change(FlowAppChart.getTimeSeriesData);

                var placeholder = $('<div>');
                $(placeholder).attr("id", "placeholder");
                $(placeholder).css({ "font-size": "10px", "line-height": "1.2em" });
                $(placeholder).width(450);
                $(placeholder).height(200);
                chartDiv.append(placeholder);

                var legendPlaceholder = $('<div>');
                $(legendPlaceholder).attr("id", "legendPlaceholder");
                $(legendPlaceholder).css({ "font-size": "8px", "line-height": "0.8em","padding-top":"15px","display":"" });
                $(legendPlaceholder).width(500);
                $(legendPlaceholder).height(30);
                chartDiv.append(legendPlaceholder);

                FlowAppChart.getTimeSeriesData();              

                
                
            },

            getTimeSeriesData: function () {

                $("#placeholder").html(null); //clear the existing chart
                $("#legendPlaceholder").html(null); //clear the existing chart

                var metricID = $("#ddTimeSeriesMetrics").val();

                if (!metricID)
                    return;


                var HUC12;

                if (document.getElementById("hidHUC12ID"))
                    HUC12 = $("#hidHUC12ID").val();
                 
                if (document.getElementById("ddNavResults"))
                    HUC12 = $("#ddNavResults").val();

                var promise = $.ajax({
                    type: "GET",
                    url: FlowAppChart.configVals.WaterFALLService + "GetMetric/.jsonp?metric_id=" + metricID + "&feature_id=" + HUC12,
                    dataType: 'jsonp'

                });

                promise.done(FlowAppChart.makeTimeSeriesChart);

                //failure
                promise.fail(function (xhr, status, error) {
                    alert("XHR: " + xhr.responseText + " Status: " + status + " Error: " + error);

                });
            },

            makeTimeSeriesChart: function (response) {

                //$("#placeholder").html(null); //clear the existing chart
                //$("#legendPlaceholder").html(null); //clear the existing chart

                if (response.length > 0) {
                    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    var fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                    var series1 = []; //baseline
                    var series2 = []; //increased water use
                    var series3 = []; //climate change
                    var series4 = []; //both

                    $.each(response, function () {
                        var startDate = this.metric_start_date;
                        var strMonth = startDate.split("-")[1];
                        switch (this.scenario_type_name) {
                            case FlowAppChart.metricConfig.scenarios["1"].scenarioName:
                                series1.push([parseInt(strMonth), this.metric_value])
                                break;
                            case FlowAppChart.metricConfig.scenarios["2"].scenarioName:
                                series2.push([parseInt(strMonth), this.metric_value])
                                break;
                            case FlowAppChart.metricConfig.scenarios["3"].scenarioName:
                                series3.push([parseInt(strMonth), this.metric_value])
                                break;
                            case FlowAppChart.metricConfig.scenarios["4"].scenarioName:
                                series4.push([parseInt(strMonth), this.metric_value])
                                break;                            
                        }
                        
                    });

                    var chart = $.plot(placeholder, [                      
                        
                        { data: series1, label: FlowAppChart.metricConfig.scenarios["1"].displayName, lines: {lineWidth:6} },
                        { data: series4, label: FlowAppChart.metricConfig.scenarios["4"].displayName, lines: {lineWidth:6} },
                        { data: series2, label: FlowAppChart.metricConfig.scenarios["2"].displayName },
                        { data: series3, label: FlowAppChart.metricConfig.scenarios["3"].displayName }                      
                       

                    ], {
                        series: {
                            lines: {
                                show: true
                            },
                            points: {
                                show: false
                            },

                            shadowSize:0
                        },
                        colors: ["#edc240", "#cb4b4b", "#afd8f8", "#339933", ],
                        grid: {
                            hoverable: true,
                            clickable: false
                        },
                        legend:{
                            show:false
                        },
                        /*legend: {
                            container: $("#legendPlaceholder"),
                            noColumns:2

                        },*/
                        yaxis: {
                            //min: -1.2,
                            //max: 1.2,
                            position: "left"
                        },
                        xaxis: {
                            tickFormatter: function (val, axis) {
                                return (months[val - 1]);
                            }
                        }
                    });

                    $("#placeholder").on("plothover", function (event, pos, item) {
                       /* $("#tdBaseValue").css("font-weight", "normal");
                        $("#tdBothValue").css("font-weight", "normal");
                        $("#tdUseValue").css("font-weight", "normal");
                        $("#tdChangeValue").css("font-weight", "normal");*/

                        if (item) {
                        
                            //get the index from the series, and then use this to show all of the values

                            var index = item.dataIndex;
                            var month = fullMonths[item.series.data[index][0] - 1]
                            $("#tdMonth1").html(month);
                            $("#tdMonth2").html(month);
                            $("#tdBaseValue").html(series1[index][1]);
                            $("#tdBothValue").html(series4[index][1]);
                            $("#tdUseValue").html(series2[index][1]);
                            $("#tdChangeValue").html(series3[index][1]);
                            /*switch (item.series.data[index][1]) {
                                case series1[index][1]:
                                    $("#tdBaseValue").css("font-weight", "900");
                                case series4[index][1]:
                                    $("#tdBothValue").css("font-weight", "900");
                                case series2[index][1]:
                                    $("#tdUseValue").css("font-weight", "900");
                                case series3[index][1]:
                                    $("#tdChangeValue").css("font-weight", "900");

                            }*/

                    } 
                    }); //end of plot hover code


                    //lets fill out the legend table 
                    if ($("#tdBaseLabel").html() == "") {
                    
                        $("#tdBaseLabel").html(FlowAppChart.metricConfig.scenarios["1"].displayName);
                        var baseImage = $('<img>');
                        $(baseImage).attr("src", "plugins/flow_app/images/Yellow.png");
                        $("#tdBaseImage").append(baseImage);

                        $("#tdBothLabel").html(FlowAppChart.metricConfig.scenarios["4"].displayName);
                        var bothImage = $('<img>');
                        $(bothImage).attr("src", "plugins/flow_app/images/red.png");
                        $("#tdBothImage").append(bothImage);

                         $("#tdUseLabel").html(FlowAppChart.metricConfig.scenarios["2"].displayName);
                        var useImage = $('<img>');
                        $(useImage).attr("src", "plugins/flow_app/images/blue.png");
                        $("#tdUseImage").append(useImage);

                         $("#tdChangeLabel").html(FlowAppChart.metricConfig.scenarios["3"].displayName);
                        var changeImage = $('<img>');
                        $(changeImage).attr("src", "plugins/flow_app/images/green.png");
                        $("#tdChangeImage").append(changeImage);
                    }
                    //get rid of any existing values
                    $("#tdMonth1,#tdMonth2,#tdBaseValue, #tdBothValue, #tdUseValue, #tdChangeValue").html("");
                }
                else {
                    $("#placeholder").html("No Data Available for the Selected HUC 12");
                }

                $("#legendPlaceholder td").css({ "font-size": "10px" });
                $("#legendPlaceholder tr").css({ "height": "10px" });
                
            },

            show_tooltip: function(x, y, contents, z) {
                $('<div id="bar_tooltip">' + contents + '</div>').css({
                    top: y,//y - 45,
                    left:x, //x - 28,
                    'border-color': z,
                }).appendTo(FlowAppChart.container).show();//.fadeIn();
            },

            //var previous_point = null;
            //var previous_label = null;

            
        }
    

    return FlowAppChart;
})