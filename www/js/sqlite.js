//sqlite
var db;
var shortName = 'BillsSQLite';
var version = '1.0';
var displayName = 'BillsSQLite';
var maxSize = 65535;

function db_init() {

    if (!window.openDatabase) {
        alert('Databases are not supported in this browser.');
        return;
    }
    db = openDatabase(shortName, version, displayName, maxSize);
    db.transaction(function (tx) {
        //tx.executeSql('DROP TABLE IF EXISTS bills');
        //tx.executeSql('DROP TABLE IF EXISTS bills_log');
        tx.executeSql(`
            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                normalized TEXT NOT NULL,
                day INTEGER,
                month INTEGER,
                repeat INTEGER DEFAULT 0,
                paid INTEGER DEFAULT 0,
                lastpaidmonth TEXT,
                description TEXT
            )
        `, [], db_nullHandler, db_errorHandler);
        tx.executeSql(`
            CREATE TABLE IF NOT EXISTS bills_log (
                id INTEGER PRIMARY KEY,
                bill_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                status TEXT NO NULL
            )
        `, [], db_nullHandler, db_errorHandler);
        // tx.executeSql(`
        //     CREATE TABLE IF NOT EXISTS events (
        //         id INTEGER PRIMARY KEY,
        //         title TEXT NOT NULL,
        //         normalized TEXT NOT NULL
        //     )
        // `, [], db_nullHandler, db_errorHandler);
        // ID    event_id      repeat_start       repeat_interval    repeat_year    repeat_month    repeat_day    repeat_week    repeat_weekday
        // tx.executeSql(`
        //     CREATE TABLE IF NOT EXISTS events_meta (
        //         id INTEGER PRIMARY KEY,
        //         event_id INTEGER,
        //         repeat_start TEXT,
        //         repeat_interval TEXT,
        //         repeat_year TEXT,
        //         repeat_month TEXT,
        //         repeat_day TEXT,
        //         repeat_week TEXT,
        //         repeat_weekeday TEXT
        //     )
        // `, [], db_nullHandler, db_errorHandler);
        
    }, db_errorHandler, db_successCallBack);
}

function db_errorHandler(transaction, error) {
    //alert('Error: ' + error.message + ' code: ' + error.code);
    //console.log('Error: ' + error.message + ' code: ' + error.code);
}

function db_successCallBack() {
    //console.log("DEBUGGING: success");
}

function db_nullHandler() {

}
