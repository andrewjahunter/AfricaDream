
$(document).on("pagecreate", function (event, ui) {
    if (gdd) {
        if (gdd.appInitialized) {

        }
    }

});

$(document).on("pagecontainershow", function (event, ui) {

    if (gdd) {
        if (gdd.appInitialized) {
            if (!gdd.activePage) {
                gdd.activePage = gdd.pages.index;
            }

            gdd.activePage.view.show();


            $(".headerMenuHome").off().on("tap", function () {

                gdd.changePage(gdd.pages.home, { transition: "flip", reverse: true })

            })
        }
    }

  




});

$(document).on("pagebeforeshow", function (event) {
    if (gdd) {
        if (gdd.appInitialized) {

        }
    }
});

$(document).on("pagebeforehide", 'div:jqmData(role="page")', function (event, ui) {

    if (gdd) {
        if (gdd.appInitialized) {

        }
    }

});