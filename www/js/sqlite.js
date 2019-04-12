//sqlite
var db = null;
var dbParams = {
    name : "BillsSQL.db",        // unique name of the database, as it will be stored in disk.
    version: '1.0',                     // database version
    displayName : "BillsSQL.db", // A human friendly name for the database, which the system will use if it needs to describe your database to the user
    estimatedSize :  65535          // in bytes

};

function db_init() {
    
    if (!window.openDatabase) {
        toastr.error("Database are not supported in this browser.");
        return;
    }
    if (window.cordova.platformId === 'browser') {
        db = window.openDatabase(dbParams.name, dbParams.version, dbParams.displayName, dbParams.estimatedSize);
    } else {
        db = window.sqlitePlugin.openDatabase({
            name: dbParams.name,
            location: 'default',
            androidDatabaseProvider: 'system'
        });
    }

    db.transaction(function (transaction) {
        // tx.executeSql('DROP TABLE IF EXISTS bills');
        // tx.executeSql('DROP TABLE IF EXISTS bills_log');
        // tx.executeSql('DROP TABLE IF EXISTS events');
        // tx.executeSql('DROP TABLE IF EXISTS events_meta');
        transaction.executeSql(`
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
        transaction.executeSql(`
            CREATE TABLE IF NOT EXISTS bills_log (
                id INTEGER PRIMARY KEY,
                bill_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                status TEXT NO NULL
            )
        `, [], dbNullHandler, dbErrorHandler);
        // transaction.executeSql(`
        //     CREATE TABLE IF NOT EXISTS events (
        //         id INTEGER PRIMARY KEY,
        //         title TEXT NOT NULL,
        //         normalized TEXT NOT NULL
        //     )
        // `, [], dbNullHandler, dbErrorHandler);
        // transaction.executeSql(`
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

function dbErrorHandler(transaction, error) {
    alert('Error: ' + error.message + ' code: ' + error.code);
    //console.log('Error: ' + error.message + ' code: ' + error.code);
    return true; //THIS IS IMPORTANT FOR TRANSACTION TO ROLLBACK ON QUERY ERROR
}

function dbSuccessCallBack() {
    //console.log("DEBUGGING: success");
}

function dbNullHandler() {

}
