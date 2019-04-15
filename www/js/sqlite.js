//sqlite
var db = null;
var dbParams = {
    name : "BillsSQL",        // unique name of the database, as it will be stored in disk.
    version: '1.0',                     // database version
    displayName : "BillsSQL", // A human friendly name for the database, which the system will use if it needs to describe your database to the user
    estimatedSize :  65535          // in bytes

};

function db_init() {
    
    if (!window.openDatabase) {
        toastr.error("Database are not supported in this browser.");
        return;
    }
    db = window.openDatabase(dbParams.name, dbParams.version, dbParams.displayName, dbParams.estimatedSize);


    db.transaction(function (tx) {
        // tx.executeSql('DROP TABLE IF EXISTS bills');
        // tx.executeSql('DROP TABLE IF EXISTS bills_log');
        // tx.executeSql('DROP TABLE IF EXISTS events');
        // tx.executeSql('DROP TABLE IF EXISTS events_meta');
        tx.executeSql(`
            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                normalized TEXT NOT NULL,
                day INTEGER,
                paid INTEGER DEFAULT 0,
                lastpaidmonth TEXT,
                description TEXT
            )
        `, [], dbNullHandler, dbErrorHandler);
        tx.executeSql(`
            CREATE TABLE IF NOT EXISTS bills_log (
                id INTEGER PRIMARY KEY,
                bill_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                value TEXT, 
                status TEXT NO NULL
            )
        `, [], dbNullHandler, dbErrorHandler);
        // tx.executeSql(`
        //     CREATE TABLE IF NOT EXISTS events (
        //         id INTEGER PRIMARY KEY,
        //         title TEXT NOT NULL,
        //         normalized TEXT NOT NULL
        //     )
        // `, [], dbNullHandler, dbErrorHandler);
        // tx.executeSql(`
        //     CREATE TABLE IF NOT EXISTS events_meta (
        //         id INTEGER PRIMARY KEY,
        //         event_id INTEGER,
        //         time_start TEXT,
        //         time_end TEXT,
        //         repeat_start TEXT,
        //         repeat_end TEXT,
        //         repeat_interval TEXT,
        //         repeat_year TEXT,
        //         repeat_month TEXT,
        //         repeat_day TEXT,
        //         repeat_week TEXT,
        //         repeat_weekeday TEXT
        //     )
        // `, [], dbNullHandler, dbErrorHandler);
        
    }, dbErrorHandler, dbSuccessCallBack);
}

function dbErrorHandler(tx, error) {
    alert('Error: ' + error.message + ' code: ' + error.code);
    //console.log('Error: ' + error.message + ' code: ' + error.code);
    return true; //THIS IS IMPORTANT FOR TRANSACTION TO ROLLBACK ON QUERY ERROR
}

function dbSuccessCallBack() {
    //console.log("DEBUGGING: success");
}

function dbNullHandler() {

}
