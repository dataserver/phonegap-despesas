function listItems() {

    $('#databaseTable').html('');
    db.readTransaction(function (tx) {
        tx.executeSql('SELECT * FROM bills ORDER BY day', [],
            function (tx, result) {
                if (result != null && result.rows != null) {
                    let rows = [];
                    let yyyymm = todayDate.yyyy + "" + todayDate.mm;

                    for (let i = 0, len = result.rows.length; i < len; i++) {
                        rows[i] = result.rows.item(i);
                        rows[i].day = pad(rows[i].day);
                        rows[i].paid_this_month = (rows[i].lastpaidmonth == yyyymm) ? 1 : 0;
                    }
                    let template = $.templates("#theTmpl");
                    let htmlOutput = template.render({
                        rows: rows
                    });
                    $('#databaseTable').append(htmlOutput);
                }
            }, dbErrorHandler);
    }, dbErrorHandler, dbNullHandler);

    return false;
}
function viewLog(show = true) {
    let id = $('#form_edit [name="id"]').val();
    $('#logview').html('');
    if (show) {
        db.readTransaction(function (tx) {
            tx.executeSql(' SELECT * FROM bills_log WHERE bill_id=? ', [id],
                function (transaction, result) {
                    if (result != null && result.rows != null) {
                        let rows = [];
                        let total = 0;
                        let yyyymm = todayDate.yyyy +''+ todayDate.mm;

                        for (let i = 0, len = result.rows.length; i < len; i++) {
                            rows[i] = result.rows.item(i);
                            total = total + ((rows[i].value) ? Number(rows[i].value) : 0);
                        }
                        let template = $.templates("#logTmpl");
                        let htmlOutput = template.render({
                            bill_id: id,
                            rows: rows,
                            total: total
                        });
                        $('#logview').append(htmlOutput);
                    }
                }, dbErrorHandler);
        }, dbErrorHandler, dbNullHandler);
    }

    return false;
}

function searchItem() {
    var search = $('#search').val();
    search = URLify.normalizeName(search);

    db.readTransaction(function (tx) {
        tx.executeSql(
            `SELECT * FROM bills WHERE normalized LIKE "%${search}%" `,
            [],
            function (tx, result) {
                let li = '';
                if (result != null && result.rows != null && result.rows.length > 0) {
                    for (let i = 0; i < result.rows.length; i++) {
                        let row = result.rows.item(i);
                        li += `<li><a href="edit.html?id=${row.id}">${row.title} </a></li>`;
                    }
                } else {
                    li = '<li>Not found. Try again.</li>';
                }
                $('#databaseTable').html(`
                    <ul>${li}</ul>
                    <input class="btn btn-secondary" type="button" value="Show Items" onClick="listItems()">
                `);
            },
            dbErrorHandler
        );
    }, dbErrorHandler, dbNullHandler);

    return false;
}
// db.readTransaction() // optimized to ready
// db.transaction()
function addItem() {
    let title = $('#form_edit [name="title"]').val();
    let normalized = URLify.normalizeName(title);
        normalized = normalized.toUpperCase();
    let day = $('#form_edit [name="day"]').val();
    let paid = $('#form_edit [name="paid"]').prop('checked');
        paid = (paid) ? 1 : 0;
    let lastpaidmonth = (paid == 1) ? todayDate.yyyy +''+ todayDate.mm : null;
    let description = $('#form_edit [name="description"]').val();

    let form = document.getElementById('form_edit');
    if (form.checkValidity() === false){
        toastr.error(`Some field is empty`);
    }
    form.classList.add('was-validated');


    if (!isEmptyOrSpaces(title)) {
        db.transaction(function (tx) {
            tx.executeSql(`
                INSERT INTO bills
                    (title, normalized, day, paid, lastpaidmonth, description) 
                    VALUES 
                    (?, ?, ?, ?, ?, ?)
                `,
                [title, normalized, day, paid, lastpaidmonth, description],
                dbNullHandler, dbErrorHandler
            );
        });
        window.history.back();
        // return false;
    }
}

function deleteItem() {
    let deleteById = getParameterByName("id");

    db.transaction(function (tx) {
        tx.executeSql(`
            DELETE FROM bills where id=?
            `,
            [deleteById],
            dbNullHandler,
            dbErrorHandler
        );
    });
    window.history.back();
}

function updateItem() {
    let selectedId = getParameterByName("id");

    let title = $('#form_edit [name="title"]').val();
    let normalized = URLify.normalizeName(title);
        normalized = normalized.toUpperCase();
    let day = $('#form_edit [name="day"]').val();
    let paid = $('#form_edit [name="paid"]').prop('checked');
        paid = (paid) ? 1 : 0;
    let lastpaidmonth = $('#form_edit [name="lastpaidmonth"]').val();
        lastpaidmonth = (paid == 1) ? null : lastpaidmonth;
    let description = $('#form_edit [name="description"]').val();

    let form = document.getElementById('form_edit');
    if (form.checkValidity() === false){
        toastr.error(`Some field is empty`);
    }
    form.classList.add('was-validated');
    if (!isEmptyOrSpaces(title)) {
        
        db.transaction(function (tx) {
            tx.executeSql(`
                UPDATE bills SET title=?, normalized=?, day=?, paid=?, lastpaidmonth=?, description=? WHERE id=?
                `,
                [title, normalized, day, paid, lastpaidmonth, description, selectedId],
                dbNullHandler,
                dbErrorHandler
            );
        });
        window.history.back();
        // return false;
    }
}

function backMain() {
    window.history.back();
}

function showForm() {
    let id = getParameterByName('id');

    $(".js-section-button-add-item").hide();
    $(".js-section-button-edit-item").hide();

    if (id != 0) {
        $(".js-section-button-edit-item").show();
        db.transaction(function (transaction) {
            transaction.executeSql('SELECT * FROM bills WHERE id=?', [id],
                function (transaction, result) {
                    if (result != null && result.rows != null) {
                        let data = result.rows.item(0);
                        let formEl = document.querySelector('#form_edit');

                        $("#page_title").text('Edit');
                        populateForm(formEl, data);
                    }
                }, dbErrorHandler);
        }, dbErrorHandler, dbNullHandler);

        return false;
    } else { // New entry
        $(".js-section-button-add-item").show();
        $("#page_title").text("Add new entry");
    }
}

function updatePaidStatus(id, paid = 1, value = '') {
    let lastpaidmonth = (paid == 1) ? todayDate.yyyy +''+ todayDate.mm : null;
    let datetime = todayDate.yyyy + "-" + todayDate.mm + "-" + todayDate.mm +" "+ todayTime.hh + ":" + todayTime.mm + ":" + todayTime.ss;
    let paid_txt = (paid == 1) ? "changed to paid" : "changed to unpaid";
        value = (value == '') ? '0' : value;
        value = parseFloat(value.replace(',','.').replace(' ',''));
        value = Number(value);

    db.transaction(function (tx) {
        tx.executeSql(`
                UPDATE bills SET paid=?, lastpaidmonth=? WHERE id=?
            `,
            [paid, lastpaidmonth, id],
            dbNullHandler,
            dbErrorHandler
        );
        tx.executeSql(`
            INSERT INTO bills_log
                (bill_id, date, value, status) 
                VALUES 
                (?, ?, ?,?)
            `,
            [id, datetime, value, paid_txt],
            dbNullHandler, dbErrorHandler
        );
    });
    listItems();
}

function clearLog(id) {
    db.transaction(function (tx) {
        tx.executeSql(`
            DELETE FROM bills_log WHERE bill_id=?
            `,
            [id],
            dbNullHandler,
            dbErrorHandler
        );
    });
    $("#logview").html('');
}



var today = new Date();
var todayDate = {
    dd : String(today.getDate()).padStart(2, '0'),
    mm : String(today.getMonth() + 1).padStart(2, '0'),
    yyyy : String(today.getFullYear())
};
var todayTime = {
    hh : String(today.getHours()).padStart(2, '0'),
    mm : String(today.getMinutes() + 1).padStart(2, '0'),
    ss : String(today.getSeconds()).padStart(2, '0')
};
var barcodeScannerOptions = {
    preferFrontCamera : false,                       // iOS and Android
    showFlipCameraButton : false,                    // iOS and Android
    showTorchButton : true,                          // iOS and Android
    torchOn: false,                                  // Android, launch with the torch switched on (if available)
    saveHistory: false,                              // Android, save scan history (default false)
    prompt : "Place a barcode inside the scan area", // Android
    resultDisplayDuration: 0,                        // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
    formats : "QR_CODE",                             // default: all but PDF_417 and RSS_EXPANDED
    orientation : "portrait",                        // Android only (portrait|landscape), default unset so it rotates with the device
    disableAnimations : true,                        // iOS
    disableSuccessBeep: false                        // iOS and Android
};
toastr.options = {
    closeButton : false,
    debug : false,
    newestOnTop : true,
    progressBar : false,
    positionClass : "toast-top-center",
    preventDuplicates : false,
    onclick : null,
    showDuration : 300,
    hideDuration : 1000,
    timeOut : 5000,
    extendedTimeOut : 1000,
    showEasing : "swing",
    hideEasing : "linear",
    showMethod : "fadeIn",
    hideMethod : "fadeOut"
};

window.onload = function () {

    db_init();

    if ($("#search").length) {
        let node = document.getElementById("search");
        node.addEventListener("keyup", function (event) {
            if (event.key === "Enter") {
                searchItem();
            }
        });
    }
    if ($("#databaseTable").length) {
        listItems();

        $(document).on("click", ".js-set-paid", function (e) {
            let id = $(this).attr('data-id');

            bootbox.prompt({
                title: "Mark as Paid?",
                size: "small",
                centerVertical: true,
                value: '0.0',
                callback: function (result) {
                    if (result != null) {
                        result = (result == ''|| result=='0.0') ? '0.0' : result;
                        updatePaidStatus(id, 1, result);
                    }
                }
            });
        });
        $(document).on("click", ".js-set-unpaid", function (e) {
            let id = $(this).attr('data-id');

            bootbox.confirm({
                size: "small",
                centerVertical: true,
                message: "Mark as Unpaid?",
                callback: function (result) {
                    if (result) {
                        updatePaidStatus(id, 0);
                    } else { }
                }
            });
        });
    }
    if ($("#form_edit").length) {
        showForm();

        $(".js-scan-qrcode").click(function(e){
            let target_el = $(this).attr("data-target");

            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    $(`#form_edit [name="${target_el}"]`).val( result.text );
                    // alert("We got a barcode\n" + "Result: " + result.text + "\n" + "Format: " + result.format + "\n" + "Cancelled: " + result.cancelled);
                },
                function (error) {
                    alert("Scanning failed: " + error);
                },
                barcodeScannerOptions
            );
        });

        $(".js-back-main").click(function(e){
            $(this).focus();
            backMain();
        });
        $(".js-update-item").click(function(e){
            $(this).focus();
            updateItem();
        });
        $(".js-add-item").click(function(e){
            $(this).focus();
            addItem();
        });
        $(".js-view-log").click(function(e){
            $(this).focus();
            let status = $(this).attr("data-status");

            if (status == "1" || status == "open") {
                viewLog(false);
                $(this).html(`<i class="fa fa-chevron-down" aria-hidden="true"></i>`);
                $(this).attr("data-status", "closed");
            } else {
                viewLog(true);
                $(this).attr("data-status", "open");
                $(this).html(`<i class="fa fa-chevron-up" aria-hidden="true"></i>`);
            }
        });
        $(".js-delete-item").click(function(e){
            $(this).focus();
            bootbox.confirm({
                size: "small",
                centerVertical: true,
                message: "DELETE: Are you sure?",
                callback: function (result) {
                    if (result) {
                        deleteItem();
                    } else { }
                }
            });
        });
        
        $(document).on("click", ".js-log-clean", function (e) {
            let id = $(this).attr('data-id');

            bootbox.confirm({
                size: "small",
                centerVertical: true,
                message: "Want to clear the log?",
                callback: function (result) {
                    if (result) {
                        clearLog(id);
                    } else { }
                }
            });
        });
    }

};