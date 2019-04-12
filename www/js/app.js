function listItems() {

    $('#databaseTable').html('');
    db.transaction(function (transaction) {
        transaction.executeSql('SELECT * FROM bills ORDER BY day', [],
            function (transaction, result) {
                if (result != null && result.rows != null) {
                    let rows = [];
                    let yyyymm = todayDate.yyyy + "" + todayDate.mm;

                    for (let i = 0, len = result.rows.length; i < len; i++) {
                        rows[i] = result.rows.item(i);
                        rows[i].day = pad(rows[i].day);
                        // if (rows[i].month != "") {
                        //     rows[i].month = pad(rows[i].month);
                        // }
                        rows[i].paid_this_month = (rows[i].lastpaidmonth == yyyymm) ? 1 : 0;
                    }
                    let template = $.templates("#theTmpl");
                    let htmlOutput = template.render({
                        rows: rows
                    });
                    $('#databaseTable').append(htmlOutput);
                }
            }, db_errorHandler);
    }, db_errorHandler, db_nullHandler);

    return false;
}
function viewLog() {
    let id = $('#form_edit [name="id"]').val();
    $('#logview').html('');

    db.transaction(function (transaction) {
        transaction.executeSql(' SELECT * FROM bills_log WHERE bill_id=? ', [id],
            function (transaction, result) {
                if (result != null && result.rows != null) {
                    let rows = [];
                    let yyyymm = todayDate.yyyy + "" + todayDate.mm;

                    for (let i = 0, len = result.rows.length; i < len; i++) {
                        rows[i] = result.rows.item(i);
                    }
                    let template = $.templates("#logTmpl");
                    let htmlOutput = template.render({
                        bill_id: id,
                        rows: rows
                    });
                    $('#logview').append(htmlOutput);
                }
            }, db_errorHandler);
    }, db_errorHandler, db_nullHandler);

    return false;
}

function searchItem() {
    var search = $('#search').val();
    search = URLify.normalizeName(search);

    db.transaction(function (transaction) {
        transaction.executeSql(
            `SELECT * FROM bills WHERE normalized LIKE "%${search}%" `,
            [],
            function (transaction, result) {
                let li = '';
                if (result != null && result.rows != null && result.rows.length > 0) {
                    for (let i = 0; i < result.rows.length; i++) {
                        let row = result.rows.item(i);
                        li += `<li><a href="edit.html?id=${row.id}">${row.title} </a></li>`;
                    }
                } else {
                    li = '<li>Not found. Try again.</li>';
                }
                $('#databaseTable').html(`<ul>${li}</ul>`);
            },
            db_errorHandler
        );
    }, db_errorHandler, db_nullHandler);

    return false;
}

function addItem() {
    let title = $('#form_edit [name="title"]').val();
    let normalized = URLify.normalizeName(title);
    normalized = normalized.toUpperCase();
    let day = $('#form_edit [name="day"]').val();
    let paid = $('#form_edit [name="paid"]').prop('checked');
    paid = (paid) ? 1 : 0;
    let lastpaidmonth = (paid==1) ? todayDate.yyyy + "" + todayDate.mm : null;
    let description = $('#form_edit [name="description"]').val();

    if (!isEmptyOrSpaces(title)) {
        db.transaction(function (tx) {
            tx.executeSql(`
                INSERT INTO bills
                    (title, normalized, day, paid, lastpaidmonth, description) 
                    VALUES 
                    (?, ?, ?, ?, ?, ?)
                `,
                [title, normalized, day, paid, lastpaidmonth, description],
                db_nullHandler, db_errorHandler
            );
        });
        window.history.back();
        // return false;
    } else {
        alert(`Some field is empty`);
    }
}

function deleteItem() {
    let deleteById = getParameterByName("id");

    db.transaction(function (tx) {
        tx.executeSql(`
            DELETE FROM bills where id=?
            `,
            [deleteById],
            db_nullHandler,
            db_errorHandler
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
    lastpaidmonth = (paid == 0) ? null : lastpaidmonth;
    let description = $('#form_edit [name="description"]').val();


    if (!isEmptyOrSpaces(title)) {
        db.transaction(function (tx) {
            tx.executeSql(`
                UPDATE bills SET title=?, normalized=?, day=?, paid=?, lastpaidmonth=?, description=? where id=?
                `,
                [title, normalized, day, paid, lastpaidmonth, description, selectedId],
                db_nullHandler,
                db_errorHandler
            );
        });
        window.history.back();
        // return false;
    } else {
        alert(`Some field is empty`);
    }
}

function backMain() {
    window.history.back();
}

function showForm() {
    let id = getParameterByName('id');

    if (id != 0) {
        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM bills WHERE id=?', [id],
                function (tx, result) {
                    if (result != null && result.rows != null) {
                        let data = result.rows.item(0);
                        let formEl = document.querySelector('#form_edit');

                        $("#page_title").text('Edit');
                        $("#form_edit button[data-context]").hide();
                        $("#form_edit button[data-context='update']").show();

                        populateForm(formEl, data);
                    }
                }, db_errorHandler);
        }, db_errorHandler, db_nullHandler);

        return false;
    } else { // New entry
        $("#page_title").text("New entry");
        $("#form_edit button[data-context]").hide();
        $("#form_edit button[data-context='save']").show();
    }
}

function updatePaidStatus(id, paid = 1) {
    let lastpaidmonth = (paid==1) ? todayDate.yyyy + "" + todayDate.mm : null;
    let date = todayDate.yyyy + "-" + todayDate.mm + "-" + todayDate.mm +" "+ todayTime.hh + ":" + todayTime.mm + ":" + todayTime.ss;
    let paid_txt = (paid==1) ? "changed to paid" : "changed to unpaid"; 

    if (!isEmptyOrSpaces(id)) {
        db.transaction(function (tx) {
            tx.executeSql(`
                UPDATE bills SET paid=?, lastpaidmonth=? WHERE id=?
                `,
                [paid, lastpaidmonth, id],
                db_nullHandler,
                db_errorHandler
            );
            tx.executeSql(`
                INSERT INTO bills_log
                    (bill_id, date, status) 
                    VALUES 
                    (?, ?, ?)
                `,
                [id, date, paid_txt],
                db_nullHandler, db_errorHandler
            );
        });
        location.reload();
        //return false;
    } else {
        alert(`Update failed`);
    }
}

function clearLog(id) {
    db.transaction(function (tx) {
        tx.executeSql(`
            DELETE FROM bills_log WHERE bill_id=?
            `,
            [id],
            db_nullHandler,
            db_errorHandler
        );
    });
    $("#logview").html('');
}



var today = new Date();
var todayDate = {
    dd : String(today.getDate()).padStart(2, '0'),
    mm : String(today.getMonth() + 1).padStart(2, '0'),
    yyyy : today.getFullYear()
};
var todayTime = {
    hh : String(today.getHours()).padStart(2, '0'),
    mm : String(today.getMinutes() + 1).padStart(2, '0'),
    ss : String(today.getSeconds()).padStart(2, '0')
};
toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": true,
  "progressBar": false,
  "positionClass": "toast-top-center",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};

$( document ).ready(function() {

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

        $(document).on("click", ".js-click-set-paid", function (e) {
            e.preventDefault();
            let id = $(this).attr('data-id');

            bootbox.confirm({
                size: "small",
                centerVertical: true,
                message: "Mark as Paid?",
                callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/
                    if (result) {
                        updatePaidStatus(id, 1);
                    } else { }
                }
            });
        });
        $(document).on("click", ".js-click-set-unpaid", function (e) {
            e.preventDefault();
            let id = $(this).attr('data-id');

            bootbox.confirm({
                size: "small",
                centerVertical: true,
                message: "Mark as Unpaid?",
                callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/
                    if (result) {
                        updatePaidStatus(id, 0);
                    } else { }
                }
            });
        });
    }
    if ($("#form_edit").length) {
        showForm();

        $(document).on("click", ".js-log-clean", function (e) {
            e.preventDefault();
            let id = $(this).attr('data-id');

            bootbox.confirm({
                size: "small",
                centerVertical: true,
                message: "Want to clear the log?",
                callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/
                    if (result) {
                        clearLog(id);
                    } else { }
                }
            });
        });
        // $(document).on("change", "#repeat_interval", function(e){
        //     let val = $(this).val();
        //     $("#repeat_interval_value").html(val + ' days');

        // });
    }

});