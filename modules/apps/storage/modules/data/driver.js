/*
 The class provides the template for a database driver with common functionality
 */

var driver = function () {
    var log = new Log('default.driver');
    var utility = require('/modules/utility.js').utility();

    function DBDriver() {
        this.queryProvider = null;
        this.queryTranslator = null;
        this.instance = null; //The instance of the db
    }

    DBDriver.prototype.init = function (options) {
        log.info('init method called');
        utility.config(options, this);
    };

    DBDriver.prototype.connect = function (config) {
        var connectionString = '' || config.connectionString;
        var username = config.username;
        var password = config.password;
        var dbConfig = config.dbConfig || {};

        try {
            log.info('connecting to ' + connectionString);
            this.instance = new Database(connectionString, username, password, dbConfig);
        }
        catch (e) {
            throw e;
        }
    };

    DBDriver.prototype.disconnect = function () {
        this.instance.close();
        log.info('disconnected from db');
    };

    /*
     The function is used to issue a query to the database
     @query: The query to be executed
     @modelManager: An instance of the model manager which is using the db driver
     @cb: An optional callback
     @return: The results of the query after translation
     */
    DBDriver.prototype.query = function (query, schema, modelManager, model, options) {
        //var result=[];
        var options=options||{};
        var isParam=options.PARAMETERIZED||false;
        var result;

        if (isParam) {
            log.info('parametrized query');
            var args = getValueArray(model, schema, query);
            //var str=args[2];
            result = this.instance.query.apply(this.instance, args) || [];
            //result=this.instance.query(query,model.uuid,model.content,model.tenantId,model.contentType,model.contentLength);
            //query='SELECT * FROM resource WHERE uuid=?'
            //result=this.instance.query('INSERT INTO resource (uuid,content,tenantId,contentType,contentLength) VALUES (?,?,?,?,?);',
            //    'a',str,'b1','image/png',456772);

        }
        else {
            log.info('not parametrized');
            result = this.instance.query(query) || [];
        }

        var processed;
        processed = this.queryTranslator.translate(schema, modelManager, result);


        return processed;
    };

    /*
     The function creates an argument array that will be used to execute the database query
     @model: The model containing the data
     @schema: The schema of the model
     @query: The query to be executed
     @return: An argument array containing the query and values to be used in order.
     */
    function getValueArray(model, schema, query) {
        var values = [];
        values.push(query);
        var field;
        for (var index in schema.fields) {
            field = schema.fields[index];
            if(model[field.name] instanceof File){
                values.push(model[field.name].getStream());
            }
            else{
                values.push(model[field.name]);
            }

        }

        log.info(values);
        return values;
    }

    return{
        DBDriver: DBDriver
    }
}


