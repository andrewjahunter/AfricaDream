window.gdd = window.gdd || {};

window.gdd = function () {

    //#region MAPS
    var loadGoogleJsonApi = function (done_clb, fail_clb) {

        if (!(typeof google === 'object')) {


            $.getScript("http://www.google.com/jsapi?key=AIzaSyCLeCaHg4_SjCQaiF8PXVhZ0VHlwLjMQvY")
                .done(function (script, textStatus) {
                    done_clb();
                })
                .fail(function (jqxhr, settings, exception) {

                    fail_clb("We were not able to configure Google Json Api. This is most likely due to internet connectivity.")
                });
        } else {
            done_clb();
        }

    }

    var loadGoogleMapsApi = function (success_clb, fail_clb) {

        loadGoogleJsonApi(

            function () {
                if (!(typeof google.maps === 'object')) {
                    try {

                        gmapsApiLoaded = function () {
                            success_clb()
                        }

                        try {
                            google.load("maps", "3", { "callback": gmapsApiLoaded, other_params: 'sensor=false' });
                        } catch (e) {
                            fail_clb(e)
                        }

                    }

                    catch (err) {
                        fail_clb(err)
                    }
                } else {
                    success_clb();
                }
            },

            function (err) {
                fail_clb(err)
            })
    }
    //#endregion

    //#region GENERAL
    //the thing to change for each news app is the appCode, its waht is used to configure the application
    var pledgeCode = 'mobirev'
    var headers = { "apiKey": "39251c1b-7585-476e-a69f-bbee4d17dd63", "appInfo": "appcode:5001|version:1.0" }
    var baseUrl = function () {
        //return "http://localhost/webapi2/api/"
        return "http://192.168.0.2/webapi2/api/"
        // return "http://api.gododata.com/webapi2/api/"
    }

    //return an object with the unix date and display date attached. If daysAdd is nul then then
    //date is set to today. Days add is an integer which will add or minus days accordingly
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    var sysDate = function (dt) {


        if (dt) {
            return dt.getTime() / 1000;
        } else {
            return new Date().getTime() / 1000;
        }

    }

    var displayDate = function (dt) {
        if (!dt) {
            dt = new Date();
        }

        return dt.getDate() + '-' + months[dt.getMonth()] + '-' + dt.getFullYear();
        //return dt.toString(gdd.app.dateDisplayFormat);
    }

    var todayObj = function (daysAdd) {

        var obj = {};

        var today = new Date();

        if (daysAdd) {

            if (daysAdd > 0) {
                var newDate = new Date(today.getTime() + 1000 * 60 * 60 * 24 * daysAdd)
                obj.unix = sysDate(newDate);
                obj.display = displayDate(newDate);

            } else {
                daysAdd = daysAdd * (-1)
                newDate = new Date(today.getTime() - 1000 * 60 * 60 * 24 * daysAdd)
                obj.unix = sysDate(newDate);
                obj.display = displayDate(newDate);
            }
        } else {
            obj.unix = sysDate(today)
            obj.display = displayDate(today);
        }


        return obj;

    }

    var userTap = "tap"
    var thisPersonLocalStoreKey = "thisperson"
    var gomissionskey = "gomissions"
    var deviceIdKey = "deviceid"



    var userClick = "click"

    var pageTransitionOne = { "transition": "flip" }
    var pageTransitionOneReverse = { "transition": "flip", "reverse": true }

    var callApi = function (method, verb, data, success, fail) {
        var source = baseUrl() + method

        $.ajax(source, {
            type: verb,
            headers: headers,
            data: data,
            complete: function (jqxhr, status) {
                var obj = {}
                obj.status = jqxhr.status;
                obj.gdd = jqxhr.responseJSON;

                if ((obj.status === 404) || obj.status == "0") {

                    fail("The service api is not accessible at this moment. Please try again later or contact your church for help")
                } else {

                    if (obj.gdd.code === 1000) {

                        success(obj.gdd)

                    } else {
                        try {
                            fail(obj.gdd.msg)

                        }
                        catch (err) {
                            fail("The response from the service was corrupted. Please try again later or contact your church for help")

                        }

                    }


                }
            },

        });


    }

    var checkConfigData = function (getFromServer, success, fail) {

        //fail("opoasdasdasdsadsadasddads")
        //return;

        var reload = false;
        var configKey = "config"

        if (getFromServer) {
            reload = true;
        } else {

            if (gdd.config.portalId()) {
                reload = false;
            } else {
                var data = localStorage.getItem(configKey);
                if (data) {

                    data = $.parseJSON(data);

                    if (data.portalId) {

                        var today = todayObj()
                        if (data.refreshTime < today.unix) {
                            reload = true
                        } else {
                            reload = false;
                            ko.mapping.mergeFromJS(gdd.config, data);
                        }

                    } else {
                        reload = true;
                    }
                } else {
                    reload = true;
                }

            }


        }

        if (reload) {

           
            callApi(
                    "News/GetNewsAppConfig",
                   "GET",
                      null,
                           function (obj) {

                               var config = obj.gddData;

                               ko.mapping.mergeFromJS(gdd.config, config);

                               localStorage.setItem(configKey, JSON.stringify(config));

                              
                               success()
                           },
                           function (msg) {
                               
                               fail(msg)
                           })
        }
        else {

            success()
        }


    }

    var showLoader = function (text) {

        $.mobile.loading("show", {
            text: text,
            textVisible: true,
            theme: "f",
            html: ""
        });

    }

    var hideLoader = function () {
        $.mobile.loading("hide");
    }

    var isOnline = function () {
        if (window.navigator.onLine) {
            // alert("navigator ONLINE")
            return true
        } else {
            // alert("navigator OFFLINE")
            return false
        }
    }

    var deviceIsReady = false;

    var isNative = function () {
        if ((document.URL.indexOf('http://') === -1) && (document.URL.indexOf('https://') === -1)) {
            return true
        } else {
            return false
        }
    }

    var isReady = function () {
       

        if (isNative()) {

            if (deviceIsReady) {
                if (gdd) {
                    if (gdd.appInitialized) {
                        return true
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            } else {
                return false;
            }

        } else {
            if (gdd) {
                if (gdd.appInitialized) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
        }



    }

    var showErrMsg = function (err, callback) {

        if (!err) {
            err = "An unkown error has occured in the application. Sorry for the inconvenience, but please restart the application. Thank you."
        }
        // $("#glbErrMsgHeader").html(header)
        $("#glbErrMsgContent").html(err)
        $("#globalErrorMessage").popup("open", { "transition": "pop" })

        if (callback) {
            $("#globalErrorMessage").one("popupafterclose", function (event, ui) {
                callback()
            });
        }

    }

    var showMsg = function (msg, callback) {

        // $("#glbMsgHeader").html(header)
        $("#glbMsgContent").html(msg)
        $("#globalMessage").popup("open", { "transition": "pop" })

        if (callback) {
            $("#globalMessage").one("popupafterclose", function (event, ui) {
                callback()
            });
        }
    }

    var configPushNotifications = function () {


        if ((accountIsSynced()) && (!gdd.deviceId)) {


            //the success clb is invoked when the plugn returns successfully
            //fail clb is invoked when the plugin returns with an error or another error occured in the prcess
            //deviceset clb is invoked when the devideID that was given by either GCM or APN has been saved to our servers
            //notification clb is invoked whenerver a message is recieved
            var setDevicePushNotifications = function (
                 success_clb,
                 fail_clb,
                 deviceIdSet_clb,
                 notification_clb) {

                // alert("here we go")
                //check to ensure the pushNotification js file was loaded. this would also
                //mean this code is running on the native app version
                if (window.plugins) {
                    // alert("Push Noti: " + JSON.stringify(window.plugins.pushNotification))
                    if (window.plugins.pushNotification) {

                        // alert("Device Variable" + JSON.stringify(device))
                        if ((device) && (!gdd.deviceId)) {

                            // alert("TEST NOTICE: Configuring push notifications about to launch");


                            //this function is called when the plugin returns with no error, its the same for Android and iOS
                            gdd.pluginSuccessHandler = function (result) {
                                // alert("Plugin SuccessHandler Called")
                                success_clb(result);
                            }

                            //called when the plugin returns an error, its the same for both Android and iOS
                            gdd.pluginErrorHandler = function (err) {
                                //alert("The following error occurred: " + err)
                                fail_clb("The following error occurred while try to register for push notifications: " + err)


                            }

                            //this routine is called whenever the device gets a regId from its messaging provider
                            //e.g. iOS/Android etc
                            //osType:1=ios,2=Android,3=Windows
                            gdd.handleDeviceRegId = function (latestDeviceId, osType) {

                                //if we get here is is because the deviceid variable has not been set yet.
                                //first we are going to try and load the device if from local storage
                                //if it matches the id this device gets from the messaging provider then we use that one,
                                //otherwise we update our servers
                                var localDeviceId = localStorage.getItem(deviceIdKey);
                                // alert("Local DeviceId: " + localDeviceId)

                                if (latestDeviceId === localDeviceId) {
                                    //  alert("DeviceID is a match: " + localDeviceId + " vs " + latestDeviceId)
                                    gdd.deviceId = localDeviceId;
                                    deviceIdSet_clb(localDeviceId)
                                } else {
                                    //alert("TEST NOTICE: DeviceID is different. Updating Server: " + localDeviceId + " vs " + latestDeviceId)

                                    var data = { "deviceId": latestDeviceId, "osType": osType }
                                    callApi(
                                        "Security/UpdateUsersDeviceID",
                                        "GET",
                                        data,
                                        function () {
                                            localStorage.setItem(deviceIdKey, latestDeviceId);
                                            gdd.deviceId = latestDeviceId;
                                            deviceIdSet_clb(latestDeviceId);
                                        },
                                        function (err) {
                                            fail_clb(err.msg)
                                        })
                                }

                            }


                            //alert("Devive Platform: " + device.platform);

                            if (device.platform == 'android' || device.platform == 'Android') {
                                // alert("Android Platform configuration")

                                //this function is called whenever a message is recieved from GCM
                                gdd.onNotificationGCM = function (e) {
                                    // alert("Android Notification Fired")
                                    //  alert("GCM MSG" + JSON.stringify(e));

                                    switch (e.event) {
                                        case 'registered':
                                            if (e.regid.length > 0) {

                                                // alert("call regiID update")
                                                gdd.handleDeviceRegId(e.regid, "2")
                                            }
                                            break;

                                        case 'message':
                                            // this is the actual push notification. its format depends on the data model from the push server

                                            //alert("We are in the message select")
                                            var obj = {}
                                            obj.message = "";
                                            if (e.payload) {
                                                if (e.payload.message) {
                                                    obj.message = e.payload.message;
                                                }
                                                if (e.payload.title) {
                                                    // obj.title = e.payload.title;
                                                }
                                                if (e.payload.sentBy) {
                                                    //obj.sentBy = e.payload.sentBy;
                                                }
                                                if (e.payload.linkMore) {
                                                    //obj.linkMore = e.payload.linkMore;
                                                }
                                            }
                                            // alert("About to call notification_clb with obj: " + JSON.stringify(obj));
                                            //alert("Notify CLB: " + notification_clb)
                                            notification_clb(obj)

                                            break;

                                        case 'error':
                                            fail_clb('Google Cloud Messaging incurred the following error: ' + e.msg)

                                            break;

                                        default:
                                            fail_clb('An unknown error has occurred on Google Cloud Messaging')

                                            break;
                                    }
                                }

                                try {
                                    var pushme = window.plugins.pushNotification;
                                    // alert("pushme: " + pushme)

                                    var gdcSenderId = gdd.config.googleGdcProjectId();

                                    //alert("regstr: " + pushme.register);
                                    // alert("senderid: " + gdcSenderId);

                                    pushme.register(
                                        gdd.pluginSuccessHandler,
                                        gdd.pluginErrorHandler,
                                        { "senderID": gdcSenderId, "ecb": "gdd.onNotificationGCM" });
                                }
                                catch (e) {
                                    alert("The following error was generated while trying to register the device with Google Cloud Messaging: " + e)
                                }

                            }
                            else {

                                if (device.platform == 'iOS') {
                                    // alert("TEST MESSAGE: Configuring Apple iOS Messenging")

                                    gdd.tokenHandler = function (result) {
                                        // Your iOS push server needs to know the token before it can push to this device
                                        // here is where you might want to send it the token for later use.
                                        // alert("iOS Token Handler Called: " + result)
                                        gdd.handleDeviceRegId(result, "1")

                                    }

                                    // fired when a notification arrives at the device
                                    gdd.onNotificationAPN = function (event) {
                                        //  alert("iOs Notification event: " + JSON.stringify(event));

                                        var obj = {}
                                        obj.message = "";
                                        if (event.alert) {
                                            obj.message = event.alert;
                                            // alert("Alert is about to fire")

                                            //this line below caused the iOS alert window to show
                                            //navigator.notification.alert(event.alert);
                                        }

                                        if (event.sound) {
                                            //obj.sound = event.sound;
                                            // alert("Sound is about to play")
                                            var snd = new Media(event.sound);
                                            snd.play();
                                        }

                                        if (event.badge) {
                                            //obj.badge = event.badge;
                                            // alert("Badge number about to be set")
                                            var pushNotification = window.plugins.pushNotification;
                                            pushNotification.setApplicationIconBadgeNumber(gdd.pluginSuccessHandler, gdd.pluginErrorHandler, event.badge);
                                        }

                                        // alert("About to call notification_clb with obj: " + JSON.stringify(obj));
                                        notification_clb(obj)
                                    }


                                    try {

                                        //alert("Lets push Ios")
                                        var pushNotification = window.plugins.pushNotification;

                                        pushNotification.register(
                                                 gdd.tokenHandler,
                                                gdd.pluginErrorHandler, {
                                                    "badge": "true",
                                                    "sound": "true",
                                                    "alert": "true",
                                                    "ecb": "gdd.onNotificationAPN"
                                                });
                                        // alert("Lets Go")

                                    }
                                    catch (e) {
                                        alert("The following error was generated while trying to register the device with Apples Push Notification services: " + e)

                                    }

                                }


                            }

                        }
                    }
                }
            }





            setDevicePushNotifications(
                function () {
                    // alert("success event fired in apnms")                 
                },
                function (err) {

                    gdd.push.handleError(err)
                },
                function (deviceId) {
                    //the deviceid/token id has been saved
                    gdd.deviceId = deviceId;
                    //alert("DeviceID Set and Saved on Server: " + deviceId);
                },
                function (msg) {
                    gdd.push.handleMsg(msg)
                });


        }


    }

    var loadPage = function (page, transition) {

        if (!page) {
            page = gdd.pages.home;
        }

        var newPageRequested = function () {
            if (gdd.activePage) {
                if (gdd.activePage.id !== page.id) {
                    return true
                } else {
                    return false
                }
            } else {
                return true
            }
        }


        if (newPageRequested()) {

            if ((isOnline()) && (isReady())) {

                showLoader("Checking configuration...")
                checkConfigData(
                    false,
                    function () {
                        hideLoader()
                        if (!gdd.deviceId) {
                            configPushNotifications()
                        }


                        gdd.previousPage = gdd.activePage

                        gdd.activePage = page

                        if (transition) {
                            $("body").pagecontainer("change", page.path, transition);

                        } else {
                            $("body").pagecontainer("change", page.path);
                        }
                    },
                    function (err) {
                        hideLoader()
                        showErrMsg(err)
                    })



            } else {

                setTimeout(function () {
                    showErrMsg("You are not connected to the Internet. Please reconnect and then try again.")
                }, 500)
                hideLoader()

            }

        } else {
            hideLoader()
        }


    }

    var accountIsSynced = function () {

        if (gdd.thisPerson.id() > 0) {

            if (gdd.thisPerson.subscribed()) {
                return true
            } else {
                return false
            }

        } else {

            var cachPerson = localStorage.getItem(thisPersonLocalStoreKey)

            if (cachPerson) {
                var thisP = $.parseJSON(cachPerson);

                ko.mapping.mergeFromJS(gdd.thisPerson, thisP);

                if (gdd.thisPerson.id() > 0) {

                    if (gdd.thisPerson.subscribed()) {
                        return true
                    } else {
                        return false
                    }
                } else {
                    return false
                }


            } else {
                return false
            }


        }
    }
    //#endregion

    //#region GO

    //#endregion

    //#region NEWS/PRAYER
    var getNewsItems = function (getFromServer, complete, fail) {

        var reload = false;
        var newsChannelKey = "newsChannels"

        var prepareNewsViewModel = function (newsItems) {

            gdd.newsItems.removeAll();
            gdd.newsCountries.removeAll();
            gdd.newsTypes.removeAll();

            $.each(newsItems, function (i, elem) {
                gdd.newsItems.push(elem)

                if (gdd.newsCountries().indexOf(elem.country) === -1) {
                    gdd.newsCountries.push(elem.country)
                }

                if (gdd.newsTypes().indexOf(elem.type) === -1) {
                    gdd.newsTypes.push(elem.type)
                }
            })

            hideLoader()
            complete()
        }

        if (getFromServer) {
            reload = true;

        } else {
            if (gdd.newsCountries().length > 0) {
                reload = false;
                complete();
            } else {
                var news = localStorage.getItem(newsChannelKey);

                if (news) {

                    news = $.parseJSON(news);

                    if (news.length > 0) {
                        prepareNewsViewModel(news);
                        reload = false;
                        complete()
                    } else {
                        reload = true;
                    }
                } else {
                    reload = true;
                }
            }
        }

        if (reload) {

            showLoader("Fetching news items...")
            callApi(
                   "News/GetNewsItems",
                   "GET",
                   { "portalId": gdd.config.portalId() },
                           function (obj) {

                               gdd.newsItems.removeAll();
                               gdd.newsCountries.removeAll();
                               gdd.newsTypes.removeAll();

                               localStorage.removeItem(newsChannelKey)

                               var channels = obj.gddData;

                               var flattenedArray = new Array()

                               $.each(channels, function (c, channel) {
                                   $.each(channel.newsItems, function (n, item) {
                                       item["channelId"] = channel.id;
                                       item["channelName"] = channel.name;
                                       item["channelDescription"] = channel.description;
                                       item["portalId"] = channel.portalId;
                                       item["portalName"] = channel.portalName;

                                       flattenedArray.push(item)
                                   });
                               });

                               if (flattenedArray.length > 0) {
                                   localStorage.setItem(newsChannelKey, JSON.stringify(flattenedArray));
                               }

                               prepareNewsViewModel(flattenedArray)
                           },
                           function (msg) {
                               hideLoader();
                               fail(msg)
                           })
        }


    }

    var configureNewsItemWebLink = function () {

        if (gdd.selectedNewsItem.url()) {

            if (isNative()) {
                try {

                    $(".btnNewsItemWebUrl").attr("href", "#").removeAttr("target")
                    $(".btnNewsItemWebUrl").one(userClick, function () {
                        try {
                            var inAppBrowser = window.open(gdd.selectedNewsItem.url(), '_system', 'location=yes,closebuttoncaption=Done/Close');
                        }
                        catch (e) {
                            showErrMsg("We cannot load the browser on this device: " + e)
                        };
                    })
                }
                catch (e) {
                    showErrMsg("We cannot load the browser on this device: " + e)
                }
            } else {
                $(".btnNewsItemWebUrl").attr("href", gdd.selectedNewsItem.url()).attr("target", "_blank")
            }
        } else {
            $(".btnNewsItemWebUrl").hide();
        }


    }

    var changeNewsItem = function (next, forNews) {

        $(".newsListItem").fadeOut(function () {

            var totalIndexedItems = 0;
            var currIndex = 0;
            var nextIndexItem = 0;


            var availableItems = new Array()

            if (forNews) {
                availableItems = $.grep(gdd.newsItems(), function (ni, n) {
                    return (ni.forNews)
                })
            } else {
                availableItems = $.grep(gdd.newsItems(), function (ni, n) {
                    return (ni.forPrayer)
                })
            }




            if (availableItems.length > 0) {
                totalIndexedItems = availableItems.length - 1

                var currItem = $.grep(availableItems, function (ni, n) {
                    return (ni.id == gdd.selectedNewsItem.id())
                })

                if (currItem.length > 0) {
                    currIndex = availableItems.indexOf(currItem[0])
                }

                if (next) {
                    if (currIndex == totalIndexedItems) {
                        nextIndexItem = 0
                    } else {
                        nextIndexItem = currIndex + 1;
                    }
                } else {
                    if (currIndex == 0) {
                        nextIndexItem = totalIndexedItems
                    } else {
                        nextIndexItem = currIndex - 1
                    }
                }

                var nextItem = null
                $.each(availableItems, function (i, elem) {
                    if (availableItems.indexOf(elem) == nextIndexItem) {
                        nextItem = elem
                    }
                })

                ko.mapping.mergeFromJS(gdd.selectedNewsItem, nextItem);

            }

            configureNewsItemWebLink();

            $(".newsListItem").fadeIn();
        })




    }
    //#endregion


    return {
        push: {
            handleError: function (err) {
                showErrMsg("Push Services Error: " + err)
            },
            handleMsg: function (msg) {
                showErrMsg("Push Message:" + msg)
            }
        },
        deviceId: null,
        config: {
            portalId: ko.observable(null),
            portalName: ko.observable(null),
            refreshTime: ko.observable(null),
            subsFieldId: ko.observable(''),
            googleGdcProjectId: ko.observable('')
        },
        thisPerson: {
            id: ko.observable(-1),
            firstName: ko.observable(''),
            lastName: ko.observable(''),
            email: ko.observable(''),
            mobileNumber: ko.observable(''),
            subscribed: ko.observable(false)
        },
        selectedNewsItem: {
            id: ko.observable('-1'),
            title: ko.observable(''),
            content: ko.observable(''),
            country: ko.observable(''),
            type: ko.observable(''),
            headerImageUrl: ko.observable(''),
            headerVideoUrl: ko.observable(''),
            displayHeader: ko.observable(true),
            channelName: ko.observable(''),
            channelDescription: ko.observable(''),
            channelId: ko.observable(''),
            portalId: ko.observable(''),
            portalName: ko.observable(''),
            url: ko.observable(''),
            headerIsImage: ko.observable(true),



        },

        newsItems: ko.observableArray(),
        newsCountries: ko.observableArray(),
        newsTypes: ko.observableArray(),
        activePage: null,
        previousPage: null,
        appInitialized: false,
        init: function () {

            gdd.pages.give.view.myPledge.pledgeCode(pledgeCode)

            $("#globalErrorMessage").show()
            $("#globalMessage").show()


            $(".globalPopup").enhanceWithin().popup();


            ko.mapping.mergeFromJS = function (koModel, data) {
                //debugger;
                for (var parameter in data) {
                    if (typeof (koModel[parameter]) == "object")
                    { ko.mapping.mergeFromJS(koModel[parameter], data[parameter]); }
                    else {
                        if (typeof (koModel[parameter]) == "function") {
                            if (!ko.isComputed(koModel[parameter])) {
                                koModel[parameter](data[parameter]);
                            }
                        }
                    }
                }
            }


            gdd.appInitialized = true;

           // alert("Base App Initialized")

            //becuase we know this routine is called in the index page we call the show method here rather
            //than the loadPage method. If we call load page here the pagecontainer events do not fire as the index page already is
            //shown

            gdd.pages.index.view.show()


        },
        phoneGap: {
            onDeviceReady: function () {
                alert("Device ready fired")
                try {
                  deviceIsReady = true;

                    try {

                        StatusBar.overlaysWebView(false);
                        StatusBar.hide();
                    } catch (e) {
                        // alert("STATUS BAR ERROR: " + JSON.stringify(e))
                    }


                    //setTimeout(function () {
                    //    navigator.splashscreen.hide();
                    //}, 3000)



                    //alert("Device Is Ready is set")

                   // document.addEventListener("pause", gdd.init.onPause, false);

                   // document.addEventListener("resume", gdd.init.onAppResume, false);

                   // document.addEventListener("menubutton", gdd.init.onMenuKeyDown, false);

                    //document.addEventListener("offline", gdd.init.wentOffline, false);

                    //document.addEventListener("online", gdd.init.wentOnline, false);

                    //document.addEventListener("backbutton", gdd.init.onBackKeyDown, false);


                }
                catch (err) {
                    alert("The following error occured during the onDeviceReady event: " + err + ". Please check you are connected to the Internet and try again.")
                }


            }
        },
        changePage: function (page, transition) {
            loadPage(page, transition)
        },
        pages: {
            index: {
                id: "pg_index",
                path: "index.html",
                view: {
                    runLoadingProcess: function () {

                        var attemptCount = 0;
                     
                        var checkProgress = function () {
                            if ((isOnline()) && (isReady())) {

                                checkConfigData(
                                        false,
                                        function () {
                                            $("#indexPageSpinner").hide()
                                            $("#indexPageStart").fadeIn();
                                        },
                                        function (err) {
                                            $("#indexPageError").show()
                                            $("#indexPageSpinner").hide()
                                            $("#indexPageErrMsg").html("Error: " + err)
                                        })

                               

                            } else {
                                attemptCount += 1;
                                if (attemptCount === 5) {

                                    $("#indexPageError").show()
                                    $("#indexPageSpinner").hide()
                                    $("#indexPageErrMsg").html("You are not connected to the internet. Please try again.")

                                } else {


                                    setTimeout(function () {

                                        checkProgress();

                                    }, 3000);


                                }
                            }
                        }
                  
                        checkProgress();

                    },
                    show: function () {

                        var init = function () {

                            $("#btnIndexPageStart").on(userTap, function () {
                                loadPage(gdd.pages.home)
                            })
                        }

                        init()

                        $("#indexPageStart").hide();
                        $("#indexPageError").hide()

                        $("#indexPageSpinner").show()


                        deviceIsReady = false;

                        document.addEventListener("deviceready", gdd.phoneGap.onDeviceReady, false);

                        //alert("starting the loading process")
                        //alert("Function: " + gdd.init.runIndexPageLoadingProcess)
                        gdd.pages.index.view.runLoadingProcess()


                    }
                },
            },
            home: {
                id: "pg_home",
                path: "home.html",
                geoChurchStructureInitialLoadCalled: false,
                view: {
                    show: function () {

                        var displayMissingFieldMsg = function () {
                            if (gdd.config.subsFieldId()) {
                                $("#homeAccErrMsg").hide()
                            } else {
                                $("#homeAccErrMsg").html("The subscription code has not been configured for this app. Please notify the administrator in your church/ministry.")
                                $("#homeAccErrMsg").show()
                            }
                        }

                        var init = function () {


                            $("#btnGoToNewsPgHome").on(userTap, function () {
                                loadPage(gdd.pages.news, pageTransitionOne)
                            })

                            $("#btnGoToPrayPgHome").on(userTap, function () {
                                loadPage(gdd.pages.pray, pageTransitionOne)
                            })

                            $("#btnGoToGivePgHome").on(userTap, function () {

                                gdd.pages.give.view.loadPledgeTemplate(
                                    function () {

                                        var proceedFunction = function () {
                                            gdd.pages.person.view.finishedButtonText = "PROCEED TO 'GIVE'"

                                            gdd.pages.person.view.callback = function () {

                                                if (gdd.pages.person.view.status === 1) {
                                                    if (accountIsSynced()) {
                                                        loadPage(gdd.pages.give, pageTransitionOne)
                                                    } else {

                                                        showMsg("We cannot process any giving until we have all your personal information.", function () {
                                                            loadPage(gdd.pages.home, pageTransitionOneReverse)
                                                        })

                                                    }
                                                } else {
                                                    loadPage(gdd.pages.home, pageTransitionOneReverse)
                                                }


                                            }

                                            loadPage(gdd.pages.person, pageTransitionOne)
                                        }

                                        if (accountIsSynced()) {
                                            showMsg("Please confirm your personal information on the next page.", proceedFunction)

                                        } else {
                                            showMsg("You have not completed the setup of this application.<p>In order to add a pledge you are required to fully configure this application with you personal information.</p>", proceedFunction)

                                        }






                                    },
                                    function (msg) {
                                        showMsg(msg)
                                    },
                                    function (err) {
                                        showErrMsg(err)
                                    })


                            })

                            $("#btnGoToGoPgHome").on(userTap, function () {

                                if (accountIsSynced()) {
                                    loadPage(gdd.pages.go, pageTransitionOne)
                                } else {
                                    showMsg("To access this feature in the application, you need to sync this application to your account.", function () {

                                        gdd.pages.person.view.finishedButtonText = "PROCEED TO 'GO'"

                                        gdd.pages.person.view.callback = function () {

                                            if (gdd.pages.person.view.status === 1) {
                                                if (accountIsSynced()) {
                                                    loadPage(gdd.pages.go, pageTransitionOne)
                                                } else {

                                                    showMsg("We cannot proceed until you have fully setup this application.", function () {
                                                        loadPage(gdd.pages.home, pageTransitionOneReverse)
                                                    })
                                                }
                                            } else {
                                                loadPage(gdd.pages.home, pageTransitionOneReverse)
                                            }
                                        }

                                        loadPage(gdd.pages.person, pageTransitionOne)

                                    })
                                }


                            })

                            $("#btnGoToFindAChurchPgHome").on(userTap, function () {

                                if (gdd.pages.churches.view.geoChurchStructureIsReady) {
                                    loadPage(gdd.pages.churches, pageTransitionOne)
                                } else {
                                    showMsg("We are still configuring the church directory in the background. This should not take more than a few seconds.Please try again in a moment.")
                                }


                            })

                            

                            $("#btnClearAllData").on(userTap, function () {

                                localStorage.clear();

                                showLoader("Loading configuration...")

                                checkConfigData(
                                    true,
                                    function () {
                                        hideLoader()
                                        window.location.href = 'index.html'
                                        //displayMissingFieldMsg()



                                    },
                                    function (err) {
                                        hideLoader()
                                        displayMissingFieldMsg()

                                        showErrMsg(err)
                                    })
                            })

                            $("#btnReloadConfig").on(userTap, function () {

                              
                                showLoader("Loading configuration...")
                                checkConfigData(
                                    true,
                                    function () {
                                        hideLoader()
                                        window.location.href = 'index.html'
                                        //displayMissingFieldMsg()



                                    },
                                    function (err) {
                                        hideLoader()
                                        displayMissingFieldMsg()

                                        showErrMsg(err)
                                    })
                            })

                            $("#btnViewAccountPgHome").on(userTap, function () {
                                gdd.pages.person.view.finishedButtonText = "CLICK HERE WHEN YOU ARE DONE"
                                gdd.pages.person.view.callback = function () {
                                    loadPage(gdd.pages.home, pageTransitionOneReverse)
                                }
                                loadPage(gdd.pages.person, pageTransitionOne)
                            })

                            $("#btnCompleteSetupPgHome").on(userTap, function () {
                                gdd.pages.person.view.finishedButtonText = "Go back to home menu"
                                gdd.pages.person.view.callback = function () {
                                    loadPage(gdd.pages.home, pageTransitionOneReverse)
                                }
                                loadPage(gdd.pages.person, pageTransitionOne)
                            })





                        }
                        init()

                        if (accountIsSynced()) {
                            $("#btnViewAccountPgHome").show()
                            $("#btnCompleteSetupPgHome").hide()
                            $("#homeAccSynced").html("Hello, " + gdd.thisPerson.firstName()).show();
                            $("#homeAccNotSynced").hide()
                        } else {
                            $("#btnViewAccountPgHome").hide()
                            $("#btnCompleteSetupPgHome").show()
                            $("#homeAccSynced").hide();
                            $("#homeAccNotSynced").show()
                        }

                        displayMissingFieldMsg()

                        if (!gdd.pages.home.geoChurchStructureInitialLoadCalled) {
                            gdd.pages.churches.view.loadGeoChurchStructure(
                                 false,
                                 function () {
                                     gdd.pages.home.geoChurchStructureInitialLoadCalled = true
                                 },
                                 function (err) {
                                     showErrMsg("The geo structure has failed to load for the following reason: " + err)
                                 })
                        }
                    }
                }
            },
            news: {
                id: "pg_news",
                path: "news.html",
                view: {
                    show: function () {

                        var configureDisplay = function () {
                            var arr = new Array()

                            arr = $.grep(gdd.newsItems(), function (ni, i) {
                                return (ni.forNews)
                            })

                            if (arr.length > 0) {

                                ko.mapping.mergeFromJS(gdd.selectedNewsItem, arr[0]);
                                configureNewsItemWebLink();
                                $("#noNewsItems").hide()
                                $("#newsItems").fadeIn()
                            } else {
                                $("#newsItems").hide()
                                $("#noNewsItems").fadeIn()
                            }
                        }

                        var init = function () {

                            ko.applyBindings(gdd, document.getElementById("pg_news"));

                            $(".refreshNewsFeeds").off().on(userTap, function () {
                                getNewsItems(
                                    true,
                                    function () {
                                        configureDisplay();
                                    },
                                    function (err) {
                                        showErrMsg(err)
                                    })
                            })

                            $(".btnNextNewsItem").off().on(userTap, function () {
                                changeNewsItem(true, true)
                            });

                            $("#pg_news").on("swipeleft", function () {
                                changeNewsItem(true, true)
                            });

                            $("#pg_news").on("swiperight", function () {
                                changeNewsItem(true, true)
                            });

                            $(".btnPreviousNewsItem").off().on(userTap, function () {
                                changeNewsItem(false, true)
                            });
                        }
                        init()

                        getNewsItems(
                            false,
                            function () {
                                configureDisplay();

                            },

                            function (err) {
                                showErrMsg(err)
                            })
                    }
                },
            },
            pray: {
                id: "pg_pray",
                path: "pray.html",
                view: {
                    show: function () {
                        var configureDisplay = function () {
                            var arr = new Array()
                            arr = $.grep(gdd.newsItems(), function (ni, i) {
                                return (ni.forPrayer)
                            })

                            if (arr.length > 0) {

                                ko.mapping.mergeFromJS(gdd.selectedNewsItem, arr[0]);
                                configureNewsItemWebLink();
                                $("#noPrayerItems").hide()
                                $("#prayerItems").fadeIn()
                            } else {
                                $("#prayerItems").hide()
                                $("#noPrayerItems").fadeIn()

                            }
                        }
                        var init = function () {

                            ko.applyBindings(gdd, document.getElementById("pg_pray"));

                            $(".refreshNewsFeeds").off().on(userTap, function () {
                                getNewsItems(
                                    true,
                                    function () {
                                        configureDisplay();
                                    },
                                    function (err) {
                                        showErrMsg(err)
                                    })
                            })

                            $(".btnNextPrayerItem").off().on(userTap, function () {
                                changeNewsItem(true, false)
                            });

                            $("#pg_pray").on("swipeleft", function () {
                                changeNewsItem(true, false)
                            });

                            $("#pg_pray").on("swiperight", function () {
                                changeNewsItem(true, false)
                            });

                            $(".btnPreviousNewsItem").off().on(userTap, function () {
                                changeNewsItem(false, false)
                            });

                        }
                        init();

                        getNewsItems(
                          false,
                          function () {

                              configureDisplay();


                          },
                          function (err) {
                              showErrMsg(err)
                          })
                    }
                },
            },
            give: {
                id: "pg_give",
                path: "give.html",
                view: {
                    pledgeTemplate: {
                        isActive: ko.observable(false),
                        inActiveReason: ko.observable(''),
                        id: ko.observable(-1),
                        portalId: ko.observable(''),
                        portalName: ko.observable(''),
                        title: ko.observable(''),
                        description: ko.observable(''),
                        toc: ko.observable(''),
                        thankYouText: ko.observable(''),
                        userChanged: ko.observable(''),
                        dateChanged: ko.observable(''),
                        pledgeCode: ko.observable(''),
                        personalInfoHeader: ko.observable(''),
                        fundInfoHeader: ko.observable(''),
                        bankDetails: ko.observable(''),
                        bankingInstructions: ko.observable(''),
                        funds: ko.observableArray(),
                        ccTypes: ko.observableArray(),
                        frequencies: ko.observableArray(),
                        ccy: ko.observableArray(),
                        accTypes: ko.observableArray(),
                    },
                    myPledge: {
                        personId: ko.observable(-1),
                        firstName: ko.observable(""),
                        lastName: ko.observable(""),
                        email: ko.observable(""),
                        telNumber: ko.observable(""),
                        fundId: ko.observable(""),
                        type: ko.observable("1"), //'0-eft, 1-credit card, 2-debit order
                        accName: ko.observable(""), //either the name of account or the bank account name
                        ccType: ko.observable(""),
                        amount: ko.observable(""),
                        expMonth: ko.observable("01"),
                        expYear: ko.observable("2018"),
                        accNumber: ko.observable(""), //either the account number or credit card number
                        frequency: ko.observable("Monthly"),
                        ccy: ko.observable("ZAR"),
                        cvc: ko.observable(""),
                        branchCode: ko.observable(""),
                        debitDay: ko.observable("1"),
                        pledgeCode: ko.observable(""),
                        accTypeId: ko.observable("")

                    },
                    loadPledgeTemplate: function (complete, inActive, fail) {

                        if (gdd.pages.give.view.pledgeTemplate.id() < 0) {

                            showLoader("Configuring giving profile...")

                            callApi(
                                  "Financial/GetPledgeTemplate",
                                  "GET",
                                  { "pledgeCode": pledgeCode },
                                          function (obj) {

                                              var result = obj.gddData;

                                              hideLoader();

                                              if (result.isActive) {
                                                  ko.mapping.mergeFromJS(gdd.pages.give.view.pledgeTemplate, result);
                                                  complete()
                                              } else {
                                                  inActive(result.inActiveReason)
                                              }

                                          },
                                          function (msg) {
                                              hideLoader();
                                              fail(msg)
                                          })


                        } else {
                            complete()
                        }

                    },
                    showGiveOne: function () {
                        $.when($(".giveSubView").not(".giveViewOne").fadeOut()).then(function () {
                            $(".giveViewOne").fadeIn()
                        })
                    },
                    showGiveTwo: function () {
                        $.when($(".giveSubView").not(".giveViewTwo").fadeOut()).then(function () {
                            $(".giveViewTwo").fadeIn()
                        })
                    },
                    showGiveThree: function () {

                        if (($.isNumeric(gdd.pages.give.view.myPledge.amount())) && (gdd.pages.give.view.myPledge.amount() > 0)) {
                            $.when($(".giveSubView").not(".giveViewThree").fadeOut()).then(function () {

                                if (gdd.pages.give.view.myPledge.type() == "1") {
                                    $(".giveViewDebitOrder").hide();
                                    $(".giveViewCreditCard").show();
                                } else {
                                    $(".giveViewDebitOrder").show();
                                    $(".giveViewCreditCard").hide();
                                }

                                $(".giveViewThree").fadeIn()
                            })
                        } else {
                            showMsg("You have not entered a valid pledge amount. The amount must be a positive numerical amount.")
                        }


                    },
                    show: function () {

                        var init = function () {

                            gdd.pages.give.view.myPledge.personId(gdd.thisPerson.id())
                            gdd.pages.give.view.myPledge.firstName(gdd.thisPerson.firstName())
                            gdd.pages.give.view.myPledge.lastName(gdd.thisPerson.lastName())
                            gdd.pages.give.view.myPledge.email(gdd.thisPerson.email())
                            gdd.pages.give.view.myPledge.telNumber(gdd.thisPerson.mobileNumber())

                            ko.applyBindings(gdd.pages.give.view, document.getElementById("pg_give"));

                            var refreshFundBinding = function () {
                                $("#myFundList").listview("refresh")

                                $(".fundItem").off().on(userTap, function () {
                                    var fundId = $(this).attr("data-id").split("|")[0]
                                    var fundName = $(this).attr("data-id").split("|")[1]
                                    $(".selectedFundName").html(fundName)
                                    gdd.pages.give.view.myPledge.fundId(fundId)
                                    gdd.pages.give.view.showGiveTwo()
                                    //alert(gdd.pages.give.view.myPledge.fundId())
                                })

                                $("select").selectmenu("refresh")
                            }

                            $("#refreshPledgeTemplate").off().on(userTap, function () {

                                gdd.pages.give.view.pledgeTemplate.id(-1) //forces a server refresh

                                gdd.pages.give.view.loadPledgeTemplate(
                                  function () {
                                      gdd.pages.give.view.showGiveOne()
                                      refreshFundBinding();
                                  },
                                  function (msg) {
                                      showMsg(msg, function () {
                                          loadPage(gdd.pages.home, pageTransitionOneReverse)
                                      })
                                  },
                                  function (err) {
                                      showErrMsg(err, function () {
                                          loadPage(gdd.pages.home, pageTransitionOneReverse)
                                      })
                                  })


                            })

                            refreshFundBinding();

                            $("#btnUpdatePledge").off().on(userTap, function () {

                                var isValid = true;
                                var inValidMsg = "";

                                if (gdd.pages.give.view.myPledge.personId() < 0) {
                                    if ((!gdd.pages.give.view.myPledge.firstName()) || (!gdd.pages.give.view.myPledge.lastName()) || (!gdd.pages.give.view.myPledge.email()) || (!gdd.pages.give.view.myPledge.telNumber())) {
                                        isValid = false;
                                        inValidMsg = "<p>You have not provided enough personal information for us to capture this pledge</p><p>We require you to provide us with your name, email and telephone number</p>"
                                    }
                                }

                                if (gdd.pages.give.view.myPledge.type() == "1") {
                                    if (!gdd.pages.give.view.myPledge.accNumber()) {
                                        isValid = false;
                                        inValidMsg = "You must provide us with a valid credit card number."
                                    }

                                    if (!gdd.pages.give.view.myPledge.accName()) {
                                        isValid = false;
                                        inValidMsg = "You must provide us with the name on your credit card."
                                    }

                                    if (!$.isNumeric(gdd.pages.give.view.myPledge.cvc())) {
                                        isValid = false;
                                        inValidMsg = "Please enter a valid cvc number."
                                    } else {
                                        if (gdd.pages.give.view.myPledge.cvc() < 0) {
                                            isValid = false;
                                            inValidMsg = "Please enter a valid cvc number."
                                        } else {
                                            if ((gdd.pages.give.view.myPledge.cvc().length < 3) || (gdd.pages.give.view.myPledge.cvc().length > 4)) {
                                                isValid = false;
                                                inValidMsg = "Please enter a valid cvc number."
                                            }
                                        }
                                    }
                                } else {

                                    if (!gdd.pages.give.view.myPledge.accNumber()) {
                                        isValid = false;
                                        inValidMsg = "You must provide us with the bank account number."
                                    }

                                    if (!gdd.pages.give.view.myPledge.accName()) {
                                        isValid = false;
                                        inValidMsg = "You must provide us with the name of the bank account."
                                    }

                                    if (!gdd.pages.give.view.myPledge.branchCode()) {
                                        isValid = false;
                                        inValidMsg = "Please enter the branch code of the bank account."
                                    }
                                }

                                if (isValid) {



                                    showLoader("Saving pledge...")

                                    callApi(
                                        "Financial/CaptureRemotePledge",
                                        "POST",
                                        ko.mapping.toJS(gdd.pages.give.view.myPledge),
                                          function (obj) {

                                              hideLoader()
                                              var pledge = obj.gddData[0]

                                              if (gdd.thisPerson.id() < 0) {
                                                  gdd.thisPerson.id(pledge.personId)

                                                  localStorage.setItem(thisPersonLocalStoreKey, JSON.stringify(ko.mapping.toJS(gdd.thisPerson)))
                                              }

                                              $("#popupPledgeThankYouMessage").one("popupafterclose", function (event, ui) {
                                                  loadPage(gdd.pages.home, pageTransitionOneReverse)
                                              });

                                              $("#popupPledgeThankYouMessage").popup("open", { "transition": "pop" })
                                          },
                                          function (msg) {
                                              hideLoader()
                                              showErrMsg(msg)
                                          })






                                    // alert(JSON.stringify(ko.mapping.toJS(gdd.pages.give.view.myPledge)))

                                } else {
                                    showMsg(inValidMsg)
                                }

                            });

                            $(".btnGiveGoTo1").off().on(userTap, function () {
                                gdd.pages.give.view.showGiveOne()
                            });

                            $(".btnGiveGoTo2").off().on(userTap, function () {
                                gdd.pages.give.view.showGiveTwo()
                            });

                            $(".btnGiveGoTo3").off().on(userTap, function () {
                                gdd.pages.give.view.showGiveThree()
                            });

                            gdd.pages.give.view.showGiveOne()


                        }
                        init()
                    }
                },
            },
            go: {
                id: "pg_go",
                path: "go.html",
                view: {

                    missions: ko.observableArray(),


                    getMissionItems: function (getFromServer, complete, fail) {

                        var updateMissionsBinding = function () {

                            var toggleMissionAttendance = function (missionId, going) {


                                showLoader("updating...")
                                callApi(
                                       "News/TogglePersonsMissionAttendance",
                                       "GET",
                                       { "missionId": missionId, "personId": gdd.thisPerson.id(), "going": going },
                                               function (obj) {
                                                   hideLoader();

                                                   if ($.isArray(obj.gddData)) {
                                                       if (obj.gddData.length > 0) {

                                                           var mission = obj.gddData[0];

                                                           var arr = $.grep(gdd.pages.go.view.missions(), function (elem, i) {
                                                               return elem.missionId == missionId
                                                           })

                                                           gdd.pages.go.view.missions.splice(gdd.pages.go.view.missions.indexOf(arr[0]), 1)

                                                           gdd.pages.go.view.missions.unshift(mission)

                                                           localStorage.setItem(gomissionskey, JSON.stringify(gdd.pages.go.view.missions()));

                                                           updateMissionsBinding()

                                                           if (going) {
                                                               showMsg("The missions co-ordinator has been notified that you would like to go on this mission.")
                                                           }
                                                       } else {
                                                           gdd.showErrMsg("The response from the server has been tempered with, please contact support.")

                                                       }
                                                   } else {
                                                       gdd.showErrMsg("The response from the server has been tempered with, please contact support.")
                                                   }


                                               },
                                               function (msg) {
                                                   hideLoader();
                                                   fail(msg)
                                               })


                            }

                            $(".btnCannotGoOnMission").on(userClick, function () {
                                var missionId = $(this).attr("data-id")

                                toggleMissionAttendance(missionId, false)

                            })

                            $(".btnGoOnMission").on(userClick, function () {
                                var missionId = $(this).attr("data-id")

                                toggleMissionAttendance(missionId, true)

                            })

                        }

                        var reload = false;


                        if (getFromServer) {
                            reload = true;

                        } else {
                            if (gdd.pages.go.view.missions().length > 0) {
                                reload = false;
                                updateMissionsBinding()
                                complete();
                            } else {
                                var cacheMissions = localStorage.getItem(gomissionskey);

                                if (cacheMissions) {

                                    cacheMissions = $.parseJSON(cacheMissions);

                                    if (cacheMissions.length > 0) {
                                        reload = false;

                                        gdd.pages.go.view.missions.removeAll()
                                        $.each(cacheMissions, function (m, mission) {
                                            gdd.pages.go.view.missions.push(mission)
                                        });

                                        updateMissionsBinding()
                                        complete()
                                    } else {
                                        reload = true;
                                    }
                                } else {
                                    reload = true;
                                }
                            }
                        }

                        if (reload) {

                            showLoader("Loading missions...")
                            callApi(
                                   "News/GetPersonsMissionProfiles",
                                   "GET",
                                   { "portalId": gdd.config.portalId(), "personId": gdd.thisPerson.id() },
                                           function (obj) {
                                               hideLoader();

                                               gdd.pages.go.view.missions.removeAll()
                                               localStorage.removeItem(gomissionskey);

                                               if ($.isArray(obj.gddData)) {
                                                   if (obj.gddData.length > 0) {
                                                       var cacheMissions = obj.gddData;

                                                       localStorage.setItem(gomissionskey, JSON.stringify(cacheMissions));

                                                       $.each(cacheMissions, function (m, mission) {
                                                           gdd.pages.go.view.missions.push(mission)
                                                       });

                                                       updateMissionsBinding()
                                                   }
                                               }

                                               complete();
                                           },
                                           function (msg) {
                                               hideLoader();
                                               fail(msg)
                                           })
                        }


                    },



                    show: function () {

                        var configureMissionsDisplay = function () {

                            if (gdd.pages.go.view.missions().length > 0) {
                                $("#noMissionItems").hide()
                                $("#missionItems").fadeIn()
                            } else {
                                $("#missionItems").hide()
                                $("#noMissionItems").fadeIn()
                            }
                        }

                        var init = function () {

                            ko.applyBindings(gdd.pages.go.view, document.getElementById("pg_go"));

                            $(".refreshMissions").off().on(userTap, function () {
                                gdd.pages.go.view.getMissionItems(
                                       true,
                                       function () {
                                           configureMissionsDisplay()
                                       },
                                       function (err) {
                                           showErrMsg(err)
                                       })
                            });

                        }
                        init()

                        gdd.pages.go.view.getMissionItems(
                            false,
                            function () {
                                configureMissionsDisplay()
                            },
                            function (err) {
                                showErrMsg(err)
                            })
                    }
                },
            },
            churches: {
                id: "pg_churches",
                path: "churches.html",
                view: {
                    myChurchQry: {
                        country: ko.observable(''),
                        region: ko.observable(''),
                        city: ko.observable(''),
                        portalId: ko.observable(''),
                    },
                    latLng: new Array(),
                    geoChurchStructureKey: "geochurchstructure",
                    geoChurchStructureIsReady: false,
                    geoChurchStructure: null,
                    countriesSearch: ko.observableArray(),
                    regionsSearch: ko.observableArray(),
                    citiesSearch: ko.observableArray(),
                    loadGeoChurchStructure: function (getFromServer, complete, fail) {
                        gdd.pages.churches.view.geoChurchStructureIsReady = false;

                        var reload = false;

                        if (getFromServer) {
                            reload = true;

                        } else {
                            if (gdd.pages.churches.view.geoChurchStructure) {
                                reload = false;
                                gdd.pages.churches.view.geoChurchStructureIsReady = true;
                                complete();
                            } else {
                                var geoChurchStructure = localStorage.getItem(gdd.pages.churches.view.geoChurchStructureKey);

                                if (geoChurchStructure) {

                                    geoChurchStructure = $.parseJSON(geoChurchStructure);

                                    if (geoChurchStructure.countries.length > 0) {
                                        reload = false;

                                        gdd.pages.churches.view.geoChurchStructure = geoChurchStructure

                                        gdd.pages.churches.view.geoChurchStructureIsReady = true;
                                        complete()
                                    } else {
                                        reload = true;
                                    }
                                } else {
                                    reload = true;
                                }
                            }
                        }

                        if (reload) {

                            var qry = {}
                            qry.scope = 0
                            qry.entityType = "Congregation"

                            callApi(
                                   "RefData/GetGeoStructure",
                                   "POST",
                                   qry,
                                           function (obj) {


                                               localStorage.removeItem(gdd.pages.churches.view.geoChurchStructureKey);

                                               if (obj.gddData) {
                                                   if ($.isArray(obj.gddData.countries)) {
                                                       if (obj.gddData.countries.length > 0) {
                                                           var tempGeo = obj.gddData;

                                                           localStorage.setItem(gdd.pages.churches.view.geoChurchStructureKey, JSON.stringify(tempGeo));
                                                           gdd.pages.churches.view.geoChurchStructure = tempGeo;

                                                       }
                                                   }
                                               }


                                               gdd.pages.churches.view.geoChurchStructureIsReady = true;
                                               complete();
                                           },
                                           function (msg) {

                                               fail(msg)
                                           })
                        }


                    },
                    showMissingChurchMessage: function () {
                        $.when($(".churchSubView").not(".missingChurch").fadeOut()).then(function () {
                            $(".missingChurch").fadeIn();
                        })

                        $(".refreshChurchView").off().on(userTap, function () {
                            gdd.pages.churches.view.showChurchSearch()
                        });
                    },
                    showMissingGeoStructure: function () {
                        $.when($(".churchSubView").not(".missingGeoStructure").fadeOut()).then(function () {
                            $(".missingGeoStructure").fadeIn();
                        })

                        $(".refreshChurchView").off().on(userTap, function () {
                            gdd.pages.churches.view.showChurchSearch()
                        });
                    },
                    showChurchMap: function (zoom) {
                        $.when($(".churchSubView").not(".churchMap").fadeOut()).then(function () {
                            $(".churchMap").fadeIn(function () {

                                var h = $(window).height();

                                $("#gmapsCanvas").css("height", h)

                                var geoItems = gdd.pages.churches.view.latLng

                                if (geoItems.length > 0) {
                                    loadGoogleMapsApi(
                                              function () {

                                                  var myLatlng = new google.maps.LatLng(geoItems[0].lat, geoItems[0].lng);


                                                  var mapOptions = {
                                                      zoom: zoom,
                                                      center: myLatlng
                                                  };

                                                  var map = new google.maps.Map(document.getElementById("gmapsCanvas"), mapOptions);


                                                  var infowindow = new google.maps.InfoWindow();
                                                  var pinColour = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'



                                                  $.each(geoItems, function (i, value) {

                                                      var pinMarker
                                                      pinMarker = new google.maps.Marker({
                                                          position: new google.maps.LatLng(value.lat, value.lng),
                                                          animation: google.maps.Animation.DROP,
                                                          map: map,
                                                          icon: pinColour,
                                                          draggable: false
                                                      });

                                                      google.maps.event.addListener(pinMarker, 'click', (function (marker, i) {
                                                          return function () {

                                                              var arr = $.grep(gdd.pages.churches.view.churchList(), function (church, c) {
                                                                  return church.id == value.id;
                                                              })

                                                              if (arr.length > 0) {


                                                                  var content = '<div style="width:200px; height:150px" ><strong>' + arr[0].name + '</strong><div>' + arr[0].geoStreetName + '</div></br><div><strong>Service Times</strong></div>'

                                                                  content += '<table width="100%"><th><tr><td><strong><i>Time</i></strong></td><td><strong><i>Contact</i></strong></td><td><strong><i>Tel</i></strong></td></tr></th><tbody>'

                                                                  $.each(arr[0].services, function (s, service) {
                                                                      content += '<tr><td>' + service.serviceTime + '</td><td>' + service.contactPerson + '</td><td>' + service.contactTelNumber + '</td></tr>'

                                                                  });


                                                                  content += '</tbody></table></div>'


                                                              }





                                                              infowindow.setContent(content);
                                                              infowindow.open(map, pinMarker);
                                                          }
                                                      })(pinMarker, i));


                                                  });


                                                  map.setCenter(new google.maps.LatLng(geoItems[0].lat, geoItems[0].lng))


                                              },
                                              function (err) {
                                                  showErrMsg(err)

                                              })
                                } else {
                                    showMsg("There are no geo co-ordinates available to load into the map")
                                }




                            });
                        })

                        $(".refreshChurchView").off().on(userTap, function () {
                            gdd.pages.churches.view.showChurchList()
                        });

                    },
                    showChurchSearch: function () {
                        $.when($(".churchSubView").not(".churchSearch").fadeOut()).then(function () {




                            $(".churchSearch").fadeIn();
                        })

                        $(".refreshChurchView").off().on(userTap, function () {
                            showLoader("Loading geographic structures...")
                            gdd.pages.churches.view.loadGeoChurchStructure(
                                true,
                                function () {
                                    hideLoader()
                                    gdd.pages.churches.view.resetSearch();
                                },
                                function (err) {
                                    hideLoader()
                                    showErrMsg(err)
                                })
                        });

                    },
                    showChurchList: function () {
                        $.when($(".churchSubView").not(".churchList").fadeOut()).then(function () {
                            $(".churchList").fadeIn();
                        })

                        $(".refreshChurchView").off().on(userTap, function () {
                            gdd.pages.churches.view.showChurchSearch()
                        });
                    },
                    churchList: ko.observableArray(),
                    searchChurches: function (success, fail) {



                        gdd.pages.churches.view.myChurchQry.portalId(gdd.config.portalId())

                        callApi(
                            "RefData/SearchCongregations",
                            "POST",
                             ko.mapping.toJS(gdd.pages.churches.view.myChurchQry),
                                     function (obj) {

                                         var result = obj.gddData;

                                         gdd.pages.churches.view.churchList.removeAll()

                                         $.each(result, function (c, church) {
                                             gdd.pages.churches.view.churchList.push(church)
                                         })

                                         $(".btnViewChurchAddress").off().on(userClick, function () {
                                             var lat = $(this).attr("data-id").split("|")[0];
                                             var lng = $(this).attr("data-id").split("|")[1];
                                             var id = $(this).attr("data-id").split("|")[2];


                                             gdd.pages.churches.view.latLng.length = 0


                                             gdd.pages.churches.view.latLng.push({ "lat": lat, "lng": lng, "id": id })

                                             gdd.pages.churches.view.showChurchMap(10);

                                         })
                                         success()

                                     },
                                     function (msg) {

                                         fail(msg)
                                     })

                    },
                    resetSearch: function () {

                        var view = gdd.pages.churches.view

                        view.countriesSearch.removeAll()
                        view.regionsSearch.removeAll()
                        view.citiesSearch.removeAll()

                        view.myChurchQry.country('');
                        view.myChurchQry.region('');
                        view.myChurchQry.city('');

                        $.each(view.geoChurchStructure.countries, function (c, country) {
                            view.countriesSearch.push(country.name)
                        })

                        gdd.pages.churches.view.showChurchSearch()





                    },

                    show: function () {

                        if (gdd.pages.churches.view.geoChurchStructure) {

                            if (gdd.pages.churches.view.geoChurchStructure.countries.length == 0) {
                                gdd.pages.churches.view.showMissingGeoStructure()
                            } else {
                                var init = function () {

                                    ko.applyBindings(gdd, document.getElementById("pg_churches"));



                                    $(".btnLinkMissingData").off().on(userClick, function () {
                                        gdd.pages.churches.view.showMissingGeoStructure()
                                    })

                                    $("#btnViewAllChurchesOnMap").off().on(userTap, function () {

                                        var thisView = gdd.pages.churches.view
                                        thisView.latLng.length = 0

                                        $.each(thisView.churchList(), function (c, church) {
                                            thisView.latLng.push({ "lat": church.geoLat, "lng": church.geoLng, "id": church.id })
                                        })

                                        var zoom = 8

                                        if ($("#ddlGeoCity").val()) {
                                            zoom = 8
                                        } else {
                                            if ($("#ddlGeoRegion").val()) {
                                                zoom = 6
                                            } else {
                                                zoom = 4
                                            }
                                        }
                                        thisView.showChurchMap(zoom)
                                    });


                                    $("#btnFindChurches").off().on(userClick, function () {

                                        showLoader("Searching...")

                                        gdd.pages.churches.view.searchChurches(
                                            function () {

                                                if (gdd.pages.churches.view.churchList().length > 0) {
                                                    gdd.pages.churches.view.showChurchList()
                                                } else {
                                                    gdd.pages.churches.view.showMissingChurchMessage()
                                                }

                                                hideLoader()
                                            },
                                            function (err) {
                                                hideLoader()
                                                showErrMsg(err)
                                            })


                                    })

                                    $("#btnResetChurchSearch").off().on(userClick, function () {
                                        gdd.pages.churches.view.resetSearch();
                                    })



                                    $("#ddlGeoCountry").off().on("change", function () {
                                        var selectedCountry = $(this).val()
                                        gdd.pages.churches.view.regionsSearch.removeAll()

                                        if (selectedCountry) {
                                            gdd.pages.churches.view.myChurchQry.country(selectedCountry);

                                            var country = $.grep(gdd.pages.churches.view.geoChurchStructure.countries, function (country, c) {
                                                return country.name == selectedCountry
                                            })

                                            $.each(country[0].regions, function (r, region) {
                                                gdd.pages.churches.view.regionsSearch.push(region)
                                            })

                                            $(".churchSearchRegion").fadeIn()
                                        } else {
                                            $.when($(".churchSearchFilter").not(".churchSearchCountry").fadeOut()).then(function () {
                                                $(".churchSearchCountry").fadeIn();
                                            })
                                            //gdd.pages.churches.view.resetSearch();
                                        }

                                        $("#ddlGeoCountry").selectmenu("refresh")


                                    })

                                    $("#ddlGeoRegion").off().on("change", function () {
                                        var selectedRegion = $(this).val()
                                        gdd.pages.churches.view.citiesSearch.removeAll()

                                        if (selectedRegion) {
                                            var region = null

                                            gdd.pages.churches.view.myChurchQry.region(selectedRegion)


                                            $.each(gdd.pages.churches.view.geoChurchStructure.countries, function (c, country) {

                                                var arRegion = $.grep(country.regions, function (region, r) {
                                                    return region.name == selectedRegion
                                                })

                                                if (arRegion.length > 0) {
                                                    region = arRegion[0];
                                                }

                                            })

                                            if (region) {
                                                $.each(region.cities, function (c, city) {
                                                    gdd.pages.churches.view.citiesSearch.push(city)
                                                })
                                            }

                                            $(".churchSearchCity").fadeIn();
                                        } else {
                                            gdd.pages.churches.view.myChurchQry.city('')
                                            gdd.pages.churches.view.myChurchQry.region('')
                                            $(".churchSearchCity").fadeOut();
                                        }




                                        $("#ddlGeoRegion").selectmenu("refresh")

                                    })

                                    $("#ddlGeoCity").off().on("change", function () {
                                        var selectedCity = $(this).val()

                                        if (selectedCity) {
                                            gdd.pages.churches.view.myChurchQry.city(selectedCity)

                                        } else {
                                            gdd.pages.churches.view.myChurchQry.city('')

                                        }
                                        $("#ddlGeoCity").selectmenu("refresh")

                                    });



                                }
                                init()

                                gdd.pages.churches.view.resetSearch();
                            }
                        } else {
                            gdd.pages.churches.view.showMissingGeoStructure()
                        }



                    }
                },
            },
            person: {
                id: "pg_person",
                path: "person.html",
                view: {
                    action: -1,
                    callback: null,
                    finishedButtonText: '',
                    status: 1, //1-done,2-cancelled
                    show: function () {

                        var showFindAccount = function () {
                            $.when($(".personSubView").not(".personTryFindView").hide()).then(function () {
                                $(".personTryFindView").fadeIn();
                            })
                        }

                        var showAccountInfo = function () {
                            $.when($(".personSubView").not(".personInfoView").hide()).then(function () {
                                $(".pInfoInput").removeAttr("disabled")

                                if (gdd.thisPerson.id()) {

                                    if (gdd.thisPerson.id() > 100) {
                                        $("#pInfoNotSynced").hide()
                                        $(".pInfoSynced").show()

                                        $(".pInfoInput").attr("disabled", "disabled")
                                    } else {
                                        $(".pInfoSynced").hide()
                                        $("#pInfoNotSynced").show()
                                    }

                                } else {
                                    $(".pInfoSynced").hide()
                                    $("#pInfoNotSynced").show()
                                }

                                $(".personInfoView").fadeIn();
                            })
                        }

                        $("#btnOKPgPersonalInfo").html(gdd.pages.person.view.finishedButtonText)
                        gdd.pages.person.view.status = 1;

                        var init = function () {

                            ko.applyBindings(gdd, document.getElementById("pg_person"));

                            var personInfoIsValid = function () {
                                var result = true;

                                if (gdd.thisPerson.id() < 100) {
                                    if (!gdd.thisPerson.firstName()) {
                                        result = false;
                                    }

                                    if (!gdd.thisPerson.lastName()) {
                                        result = false;
                                    }

                                    if (!gdd.thisPerson.mobileNumber()) {
                                        result = false;
                                    }

                                    if (!gdd.thisPerson.email()) {
                                        result = false;
                                    } else {
                                        var reEMAIL = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                        if (!reEMAIL.test(gdd.thisPerson.email())) {
                                            result = false;
                                        }
                                    }
                                }



                                return result
                            }


                            $("#btnCheckForAccount").off().on(userTap, function () {
                                gdd.thisPerson.subscribed(false)
                                var isValid = true;

                                var input = $("#txtPInfoFindAccount").val()


                                if (input) {
                                    var reEMAIL = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                    isValid = reEMAIL.test(input);

                                    if (isValid) {
                                        gdd.thisPerson.email(input)
                                    } else {
                                        var reMOBILE = /^[0-9]+$/;
                                        isValid = reMOBILE.test(input);

                                        if (isValid) {
                                            gdd.thisPerson.mobileNumber(input)
                                        }
                                    }

                                } else {
                                    isValid = false;
                                }

                                if (isValid) {

                                    showLoader("Locating account...")


                                    callApi(
                                        "Person/FindProfileByInput",
                                        "GET",
                                        { "input": input },
                                        function (obj) {

                                            var found = false
                                            if ($.isArray(obj.gddData)) {
                                                if (obj.gddData.length > 0) {
                                                    found = true;
                                                    var theP = obj.gddData[0];

                                                    if (theP.email) {
                                                        var email1 = theP.email.split("@")[0]
                                                        var email2 = theP.email.split("@")[1]

                                                        if (email1.length === 1) {
                                                            email1 = email1
                                                        } else {
                                                            if (email1.length == 2) {
                                                                email1 = email1.substring(0, 1) + email1.substring(1).replace(/./g, "*");

                                                            } else {
                                                                email1 = email1.substring(0, 2) + email1.substring(2).replace(/./g, "*");
                                                            }
                                                        }

                                                        email2 = email2.substring(0, 4) + email2.substring(4).replace(/./g, "*");


                                                        theP.email = email1 + '@' + email2
                                                    }

                                                    if (theP.mobileNumber) {
                                                        theP.mobileNumber = theP.mobileNumber.substring(0, 5) + theP.mobileNumber.substring(5).replace(/./g, "*");

                                                    }



                                                    ko.mapping.mergeFromJS(gdd.thisPerson, theP);
                                                    gdd.thisPerson.subscribed(false)
                                                    localStorage.setItem(thisPersonLocalStoreKey, JSON.stringify(theP));
                                                }
                                            }


                                            if (found) {
                                                showAccountInfo()
                                            } else {
                                                showMsg("We were not able to find a matching account. Please enter the info on the next screen.", function () {
                                                    showAccountInfo()
                                                })
                                            }

                                            hideLoader()


                                        },
                                        function (msg) {
                                            hideLoader()
                                            showErrMsg(msg)
                                        })
                                } else {
                                    showMsg("Please enter a valid email address OR mobile number.")

                                }








                            })

                            $("#btnCheckForAccountCancel").off().on(userTap, function () {

                                loadPage(gdd.pages.home, pageTransitionOneReverse)

                            })

                            $("#btnPersonalInfoAction").off().on(userTap, function () {
                                $("#popupPersonsActionMenu").popup("open", { "transition": "pop" })
                            })


                            $("#popupPersonsActionMenu").on("popupafterclose", function (event, ui) {

                                switch (gdd.pages.person.view.action) {


                                    case 1: //not me
                                        localStorage.removeItem(thisPersonLocalStoreKey)
                                        gdd.thisPerson.id(-1)
                                        gdd.thisPerson.firstName('')
                                        gdd.thisPerson.lastName('')
                                        gdd.thisPerson.email('')
                                        gdd.thisPerson.mobileNumber('')
                                        gdd.thisPerson.subscribed(false)

                                        showFindAccount()

                                        gdd.pages.person.view.action = -1;
                                        break;

                                    case 2: //not me, try again

                                        gdd.pages.person.view.status = 2;
                                        gdd.pages.person.view.callback()

                                        gdd.pages.person.view.action = -1;
                                        break;


                                    case 3: //cancel operation

                                        gdd.pages.person.view.action = -1;
                                        break;





                                }
                            })



                            $("#btnOKPgPersonalInfo").off().on(userTap, function () {

                                if (personInfoIsValid()) {

                                    if (gdd.thisPerson.id() < 0) {

                                        showLoader("Syncing account...")

                                        callApi(
                                      "Person/QuickCreate",
                                      "GET",
                                      { "firstName": gdd.thisPerson.firstName(), "lastName": gdd.thisPerson.lastName(), "email": gdd.thisPerson.email(), "mobileNumber": gdd.thisPerson.mobileNumber(), "portalId": gdd.config.portalId() },
                                      function (obj) {
                                          hideLoader()

                                          if ($.isArray(obj.gddData)) {
                                              if (obj.gddData.length > 0) {
                                                  var theP = obj.gddData[0];

                                                  ko.mapping.mergeFromJS(gdd.thisPerson, theP);

                                                  gdd.thisPerson.subscribed(true)

                                                  localStorage.setItem(thisPersonLocalStoreKey, JSON.stringify(ko.mapping.toJS(gdd.thisPerson)))

                                                  gdd.pages.person.view.status = 1;
                                                  gdd.pages.person.view.callback()

                                              } else {
                                                  showErrMsg("The response recieved from the server has been tampered with. Please contact your church/ministry office.")
                                              }
                                          } else {
                                              showErrMsg("The response recieved from the server has been tampered with. Please contact your church/ministry office.")
                                          }

                                      },
                                      function (msg) {
                                          hideLoader()
                                          showErrMsg(msg)
                                      })

                                    } else {

                                        if (gdd.thisPerson.subscribed()) {
                                            localStorage.setItem(thisPersonLocalStoreKey, JSON.stringify(ko.mapping.toJS(gdd.thisPerson)))
                                            gdd.pages.person.view.status = 1;
                                            gdd.pages.person.view.callback()
                                        } else {

                                            showLoader("Subscribing...")

                                            callApi(
                                               "News/SubscribePersonToField",
                                               "GET",
                                               { "personId": gdd.thisPerson.id() },
                                               function (obj) {
                                                   hideLoader()

                                                   gdd.thisPerson.subscribed(true)

                                                   localStorage.setItem(thisPersonLocalStoreKey, JSON.stringify(ko.mapping.toJS(gdd.thisPerson)))
                                                   gdd.pages.person.view.status = 1;
                                                   gdd.pages.person.view.callback()


                                               },
                                               function (msg) {
                                                   hideLoader()
                                                   showErrMsg(msg)
                                               })

                                        }

                                    }

                                }
                                else {
                                    showErrMsg("Either you have not filled out all of the fields or some of the information you provided is not valid.")
                                }

                            });



                            $("#btnFindAnotherAccountPgPersonalInfo").off().on(userTap, function () {
                                gdd.pages.person.view.action = 1;
                                $("#popupPersonsActionMenu").popup("close")
                            });

                            $("#btnCancelPgPersonalInfo").off().on(userTap, function () {
                                gdd.pages.person.view.action = 2;
                                $("#popupPersonsActionMenu").popup("close")
                            });

                            $("#btnClosePgPersonalInfo").off().on(userTap, function () {
                                gdd.pages.person.view.action = 3;
                                $("#popupPersonsActionMenu").popup("close")
                            });

                        }
                        init()

                        if (accountIsSynced()) {
                            showAccountInfo()
                        } else {


                            if (gdd.thisPerson.firstName()) {
                                showAccountInfo()
                            } else {
                                showFindAccount()
                            }


                        }



                    }
                },
            },

        }
    }

}()