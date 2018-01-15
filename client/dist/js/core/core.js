/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

var CellBaseManager = {
    host: (typeof window.CELLBASE_HOST === 'undefined') ? 'http://bioinfo.hpc.cam.ac.uk/cellbase' : window.CELLBASE_HOST,
    version: (typeof window.CELLBASE_VERSION === 'undefined') ? 'v3' : window.CELLBASE_VERSION,
    get: function(args) {
        var success = args.success;
        var error = args.error;
        var async = (args.async == false) ? false: true;

        // remove XMLHttpRequest keys
        var ignoreKeys = ['success', 'error', 'async'];
        var urlConfig = {};
        for (var prop in args) {
            if (hasOwnProperty.call(args, prop) && args[prop] != null && ignoreKeys.indexOf(prop) == -1) {
                urlConfig[prop] = args[prop];
            }
        }

        var url = CellBaseManager.url(urlConfig);
        if (typeof url === 'undefined') {
            return;
        }

        if (window.CELLBASE_LOG != null && CELLBASE_LOG === true) {
            console.log(url);
        }

        var d;
        var request = new XMLHttpRequest();
        request.onload = function() {
            var contentType = this.getResponseHeader('Content-Type');
            if (contentType === 'application/json') {
                var parsedResponse = JSON.parse(this.response);
                if (typeof success === "function") success(parsedResponse);
                d = parsedResponse;
            } else {
                console.log('Cellbase returned a non json object or list, please check the url.');
                console.log(url);
                console.log(this.response)
            }
        };
        request.onerror = function() {
            console.log("CellBaseManager: Ajax call returned " + this.statusText);
            if (typeof error === "function") error(this);
        };
        request.open("GET", url, async);
        request.send();
        return d;

    },
    url: function(args) {
        if (args == null) {
            args = {};
        }
        if (args.params == null) {
            args.params = {};
        }

        var version = this.version;
        if (args.version != null) {
            version = args.version
        }

        var host = this.host;
        if (args.host != null) {
            host = args.host;
        }

        delete args.host;
        delete args.version;

        var config = {
            host: host,
            version: version
        };

        for (var prop in args) {
            if (hasOwnProperty.call(args, prop) && args[prop] != null) {
                config[prop] = args[prop];
            }
        }

        var query = '';
        if (config.query != null) {
            query = '/' + config.query.toString();
        }

        //species can be the species code(String) or an object with text attribute
        if (config.species && config.species.id != null) {
            if (config.species.assembly != null) {
                config.params["assembly"] = config.species.assembly.name;
            }
            // TODO Remove temporary fix
            if (config.subCategory === 'chromosome') {
                delete config.params["assembly"]
            }
            config.species = Utils.getSpeciesCode(config.species.scientificName);
        }

        var url;
        if (config.category === 'meta') {
            url = config.host + '/webservices/rest/' + config.version + '/' + config.category + '/' + config.subCategory;
        } else {
            url = config.host + '/webservices/rest/' + config.version + '/' + config.species + '/' + config.category + '/' + config.subCategory + query + '/' + config.resource;
        }


        url = Utils.addQueryParamtersToUrl(config.params, url);
        return url;
    }
};
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * Composes an url with the given parameters.
 * resourceType: any of OpencgaManager.resourceTypes.
 * resourceId: id of the resource in catalog.
 * action: all actions are in OpencgaManager.actions, but some methods don't allow every action.
 * queryParams: Object with the query parameters.
 * args: Object with extra arguments, like the success callback function, or host override.
 *
 * examples of use:
 *
 * OpencgaManager.users.create({
 *      query:{
 *          userId: 'user1',
 *          name: 'User One',
 *          email: 'user@example.com',
 *          password: 'password_one'
 *      },
 *      request:{
 *          success:function(response){
 *              console.log(response);
 *          },
 *          error:function(){
 *              console.log('Server error');
 *          }
 *      }
 * });
 *
 * OpencgaManager.users.login({
 *      id:'user1',
 *      query:{
 *          password: 'password_one'
 *      },
 *      request:{
 *          success:function(response){
 *              console.log(response);
 *          },
 *          error:function(){
 *              console.log('Server error');
 *          }
 *      }
 * });
 *
 * OpencgaManager.users.info({
 *      id:'user1',
 *      query:{
 *          sid: Cookies('bioinfo_sid'),
 *          lastActivity: 'lastActivity'
 *      },
 *      request:{
 *          success:function(response){
 *              console.log(response);
 *          },
 *          error:function(){
 *              console.log('Server error');
 *          }
 *      }
 * });
 *
 *    http://cafetal:8080/opencga/rest/files/3/fetch?region=20:100-200&sid=nsrblm
 *    http://cafetal:8080/opencga/rest/files/17/fetch?sid=eUZtTdnA9EU89vjACyAe&region=20%3A80000-82000&view_as_pairs=false&include_coverage=true&process_differences=false
 *    http://cafetal:8080/opencga/rest/files/17/fetch?sid=eUZtTdnA9EU89vjACyAe&region=20%3A80000-82000&view_as_pairs=false&include_coverage=true&process_differences=false
 */
var OpencgaManager = {
    host: (typeof window.OPENCGA_HOST === 'undefined') ? 'http://ws1.babelomics.org/opencga-0.7' : window.OPENCGA_HOST,
    version: (typeof window.OPENCGA_VERSION === 'undefined') ? 'v1' : window.OPENCGA_VERSION,

    users: {
        login: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'login');
        },
        logout: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'logout');
        },
        info: function(args){
          return OpencgaManager._doRequest(args, 'users', 'info');
        },
        read: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'info');
        },
        update: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'update');
        },
        updateEmail: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'change-email');
        },
        updatePassword: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'change-password');
        },
        resetPassword: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'reset-password');
        },
        create: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'create');
        },
        delete: function (args) {
            return OpencgaManager._doRequest(args, 'users', 'delete');
        }
    },

    projects: {
        list: function (args) {
            return OpencgaManager._doRequest(args, 'projects', 'all-projects');
        },
        read: function (args) {
            return OpencgaManager._doRequest(args, 'projects', 'info');
        },
        update: function (args) {
            return OpencgaManager._doRequest(args, 'projects', 'update');
        },
        create: function (args) {
            return OpencgaManager._doRequest(args, 'projects', 'create');
        },
        delete: function (args) {
            return OpencgaManager._doRequest(args, 'projects', 'delete');
        },
        studies: function (args) {
            return OpencgaManager._doRequest(args, 'projects', 'studies');
        }
    },

    studies: {
        list: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'all-studies');
        },
        info: function(args){
          return OpencgaManager._doRequest(args, 'studies', 'info');
        },
        read: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'info');
        },
        update: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'update');
        },
        create: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'create');
        },
        delete: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'delete');
        },
        analysis: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'analysis');
        },
        jobs: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'jobs');
        },
        samples: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'samples');
        },
        variants: function (args) {
            return OpencgaManager._doRequest(args, 'studies', 'variants');
        },
        files: function (args){
          return OpencgaManager._doRequest(args, 'studies', 'files');
        }
    },
    cohorts: {
        create: function (args) {
            return OpencgaManager._doRequest(args, 'cohorts', 'create');
        },
        update: function (args) {
            return OpencgaManager._doRequest(args, 'cohorts', 'update');
        }
    },

    files: {
        list: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'list');
        },
        fetch: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'fetch');
        },
        alignments: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'alignments');
        },
        variants: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'variants');
        },
        read: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'info');
        },
        info: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'info');
        },
        delete: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'delete');
        },
        index: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'index');
        },
        search: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'search');
        },
        filesByFolder: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'files');
        },
        content: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'content');
        },
        contentGrep: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'content-grep');
        },
        createFolder: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'create-folder');
        },
        setHeader: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'set-header');
        },
        contentExample: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'content-example');
        },
        downloadExample: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'download-example');
        },
        update: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'update');
        },
        download: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'download');
        },
        upload: function (args) {
            return OpencgaManager._doRequest(args, 'files', 'upload');
        },
        upload2: function (args) {
            /** Check if exists a file with the same name **/
            var query = {
                sid: Cookies('bioinfo_sid'),
                studyId: args.studyId,
            };
            // if (window.OPENCGA_OLD_URL_FORMAT != null && OPENCGA_OLD_URL_FORMAT === true) {
            //     var splitIndex = args.relativeFilePath.lastIndexOf("/") + 1;
            //     query.name = args.relativeFilePath.substring(splitIndex);
            //     query.directory = args.relativeFilePath.substring(0, splitIndex);
            // } else {
            // }
            query.path = args.relativeFilePath;
            OpencgaManager.files.search({
                query: query,
                request: {
                    success: function (response) {
                        if (response.response[0].errorMsg === '' || response.response[0].errorMsg == null) {
                            if (response.response[0].result.length == 0) {

                                /** No file found with the same name -> start upload **/
                                var url = OpencgaManager._url({
                                    query: {
                                        sid: args.sid
                                    },
                                    request: {}
                                }, 'files', 'upload');
                                args.url = url;
                                OpencgaManager._uploadFile(args);

                            } else {
                                args.error('File already exists', response.response[0].result);
                            }
                        } else {
                            args.error(response.response[0].errorMsg);
                        }
                    },
                    error: function () {
                        args.error('Server error, try again later.');
                    }
                }
            });
        }

    },
    jobs: {
        create: function (args) {
            return OpencgaManager._doRequest(args, 'jobs', 'create');
        },
        delete: function (args) {
            return OpencgaManager._doRequest(args, 'jobs', 'delete');
        },
        info: function (args) {
            return OpencgaManager._doRequest(args, 'jobs', 'info');
        }
    },
    samples: {
        info: function (args) {
            return OpencgaManager._doRequest(args, 'samples', 'info');
        },
        search: function (args) {
            return OpencgaManager._doRequest(args, 'samples', 'search');
        },
        update: function (args) {
            return OpencgaManager._doRequest(args, 'samples', 'update');
        }
    },
    panels:{
      create: function (args) {
        return OpencgaManager._doRequest(args, 'panels', 'create');
      },
      info: function (args) {
        return OpencgaManager._doRequest(args, 'panels', 'info');
      }
    },
    util: {
        proxy: function (args) {
            return OpencgaManager._doRequest(args, 'util', 'proxy');
        }
    },
    tools: {
        search: function (args) {
            return OpencgaManager._doRequest(args, 'tools', 'search');
        },
        info: function (args) {
            return OpencgaManager._doRequest(args, 'tools', 'info');
        },
        help: function (args) {
            return OpencgaManager._doRequest(args, 'tools', 'help');
        },
        update: function (args) {
            return OpencgaManager._doRequest(args, 'tools', 'update');
        },
        delete: function (args) {
            return OpencgaManager._doRequest(args, 'tools', 'delete');
        }
    },
    //analysis: {
    //    jobs: function (args) {
    //        return OpencgaManager._doRequest(args, 'analysis', 'jobs');
    //    },
    //    create: function (args) {
    //        return OpencgaManager._doRequest(args, 'analysis', 'create');
    //},
    _url: function (args, api, action) {
        var host = OpencgaManager.host;
        if (typeof args.request.host !== 'undefined' && args.request.host != null) {
            host = args.request.host;
        }
        var version = OpencgaManager.version;
        if (typeof args.request.version !== 'undefined' && args.request.version != null) {
            version = args.request.version;
        }
        var id = '';
        if (typeof args.id !== 'undefined' && args.id != null) {
            id = '/' + args.id;
        }

        var url = host + '/webservices/rest/' + version + '/' + api + id + '/' + action;
        // if (window.OPENCGA_OLD_URL_FORMAT != null && OPENCGA_OLD_URL_FORMAT === true) {
        //     if (action == 'jobs') {
        //         action = 'job'
        //     }
        //     if (api == 'jobs') {
        //         api = 'job'
        //     }
        //     url = host + '/rest/' + api + id + '/' + action;
        // }
        url = Utils.addQueryParamtersToUrl(args.query, url);
        return url;
    },

    _doRequest: function (args, api, action) {
        var url = OpencgaManager._url(args, api, action);
        if (args.request.url === true) {
            return url;
        } else {
            var method = 'GET';
            if (typeof args.request.method !== 'undefined' && args.request.method != null) {
                method = args.request.method;
            }
            var async = true;
            if (typeof args.request.async !== 'undefined' && args.request.async != null) {
                async = args.request.async;
            }

            if (window.OPENCGA_LOG != null && OPENCGA_LOG === true) {
                console.log(url);
            }
            var request = new XMLHttpRequest();
            request.onload = function () {
                var contentType = this.getResponseHeader('Content-Type');
                if (contentType === 'application/json') {
                    var json = JSON.parse(this.response);
                    if (json.error === '' || json.error == null) {
                        args.request.success(json, this);
                    } else {
                        if (window.OPENCGA_LOG != null && OPENCGA_LOG === true) {
                            console.log('! ----    OpencgaManager -------');
                            console.log(json.error);
                            console.log(json);
                            console.log('! ----    OpencgaManager -------');
                        }
                        args.request.error(json, this);
                    }
                } else {
                    args.request.success(this.response, this);
                }
            };
            request.onerror = function (e) {
                args.request.error({
                    error: 'Request error.',
                    errorEvent: e
                }, this);
            };
            request.open(method, url, async);
            request.send();
            return url;
        }
    },
    _uploadFile: function (args) {
        var url = args.url;
        var inputFile = args.inputFile;
        var fileName = args.fileName;
        var userId = args.userId;
        var studyId = args.studyId;
        var relativeFilePath = args.relativeFilePath;
        var fileFormat = args.fileFormat;
        var bioFormat = args.bioFormat;
        var description = args.description;
        var callbackProgress = args.callbackProgress;

        /**/
        var resume = true;
        var resumeInfo = {};
        var chunkMap = {};
        var chunkId = 0;
        var blob = inputFile;
        var BYTES_PER_CHUNK = 2 * 1024 * 1024;
        var SIZE = blob.size;
        var NUM_CHUNKS = Math.max(Math.ceil(SIZE / BYTES_PER_CHUNK), 1);
        var start;
        var end;

        var getResumeInfo = function (formData) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, false); //false = sync call
            xhr.send(formData);
            var response = JSON.parse(xhr.responseText);
            return response.response[0];
        };
        var checkChunk = function (id, size, resumeInfo) {
            if (typeof resumeInfo[id] === 'undefined') {
                return false;
            } else if (resumeInfo[id].size != size /*|| resumeInfo[id].hash != hash*/ ) {
                return false;
            }
            return true;
        };
        var processChunk = function (c) {
            var chunkBlob = blob.slice(c.start, c.end);

            if (checkChunk(c.id, chunkBlob.size, resumeInfo) == false) {
                var formData = new FormData();
                formData.append('chunk_content', chunkBlob);
                formData.append('chunk_id', c.id);
                formData.append('chunk_size', chunkBlob.size);
                /*formData.append('chunk_hash', hash);*/
                formData.append("filename", fileName);
                formData.append('userId', userId);
                formData.append('studyId', studyId);
                formData.append('relativeFilePath', relativeFilePath);
                /*formData.append('chunk_gzip', );*/
                if (c.last) {
                    formData.append("last_chunk", true);
                    formData.append("total_size", SIZE);
                    formData.append("fileFormat", fileFormat);
                    formData.append("bioFormat", bioFormat);
                    console.log(bioFormat);
                    formData.append("description", description);
                }
                uploadChunk(formData, c, function (chunkResponse) {
                    /* FIX--------- Remove this "FIX block" after the server fix */
                    /* Bioformat is modified on server due to BioformatDetector bug */
                    /* https://github.com/opencb/opencga/blob/develop/opencga-analysis/src/main/java/org/opencb/opencga/analysis/files/FileMetadataReader.java#L123 */
                    /* Remove this ASAP, Server bioformatDetector should be invoked if no bioformat is provided. */
                    OpencgaManager.__fix_fileBioformat(chunkResponse, bioFormat, function (f) {
                        callbackProgress(c, NUM_CHUNKS, f);
                    });
                    /* FIX-END----- Remove this "FIX block" after the server fix */

                    /* SAVE the next line!! Uncomment this line after the FIX!!! */
                    // callbackProgress(c, NUM_CHUNKS, chunkResponse);
                    if (!c.last) {
                        processChunk(chunkMap[(c.id + 1)]);
                    } else {

                    }
                });
            } else {
                callbackProgress(c, NUM_CHUNKS);
                if (!c.last) {
                    processChunk(chunkMap[(c.id + 1)]);
                } else {

                }
            }

        };
        var uploadChunk = function (formData, chunk, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.onload = function (e) {
                chunk.done = true;
                console.log("chunk done");
                callback(JSON.parse(xhr.responseText));
            };
            xhr.send(formData);
        };

        /**/
        /**/

        if (resume) {
            var resumeFormData = new FormData();
            resumeFormData.append('resume_upload', resume);
            resumeFormData.append('filename', fileName);
            resumeFormData.append('userId', userId);
            resumeFormData.append('studyId', studyId);
            resumeFormData.append('relativeFilePath', relativeFilePath);
            resumeInfo = getResumeInfo(resumeFormData);
        }

        start = 0;
        end = BYTES_PER_CHUNK;
        while (start < SIZE) {
            var last = false;
            if (chunkId == (NUM_CHUNKS - 1)) {
                last = true;
            }
            chunkMap[chunkId] = {
                id: chunkId,
                start: start,
                end: end,
                done: false,
                last: last
            };
            start = end;
            end = start + BYTES_PER_CHUNK;
            chunkId++;
        }
        processChunk(chunkMap[0]);

    },
    __fix_fileBioformat: function (chunkResponse, bioFormat, cb) {
        // THIS IS A TEMPORAL FIX, REMOVE THIS FUNCTION ASAP
        if (chunkResponse.response[0].result != null) {
            var file = chunkResponse.response[0].result[0];
            OpencgaManager.files.update({
                id: file.id,
                query: {
                    sid: Cookies('bioinfo_sid'),
                    bioformat: bioFormat
                },
                request: {
                    success: function (response) {
                        var f = response.response[0].result[0];
                        chunkResponse.response[0].result[0] = f;
                        cb(chunkResponse);
                    },
                    error: function (response) {}
                }
            });
        } else {
            cb(chunkResponse);
        }
    }
};

/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
/**/
// resourceTypes: {
//     USERS: "users",
//     PROJECTS: "projects",
//     STUDIES: "studies",
//     FILES: "files",
//     ANALYSES: "analyses",
//     JOBS: "jobs"
// },
// actions: {
//     LOGIN: "login",
//     LOGOUT: "logout",
//     CREATE: "create",
//     UPLOAD: "upload",
//     INFO: "info",
//     LIST: "list",
//     FETCH: "fetch",
//     UPDATE: "update",
//     DELETE: "delete"
// },
// httpMethods: {}, // defined after OpencgaManager
//
// /**
//  * @param queryParams required: password, sid (sessionId)
//  * @return sid (sessionId)
//  */
// login: function(userId, queryParams, args) {
//     this._call(this.resourceTypes.USERS, userId, this.actions.LOGIN, queryParams, args);
// },
// /**
//  * @param queryParams required: sid (sessionId)
//  */
// logout: function(userId, queryParams, args) {
//     this._call(this.resourceTypes.USERS, "", this.actions.LOGOUT, queryParams, args);
// },
// /**
//  * @param queryParams required: {resource}Id, password, sid (sessionId)
//  */
// create: function(resourceType, queryParams, args) {
//     this._call(resourceType, "", this.actions.CREATE, queryParam, args);
// },
// /**
//  * @param queryParams required: sid (sessionId)
//  */
// upload: function(resourceType, queryParams, args) {
//     this._call(resourceType, "", this.actions.UPLOAD, queryParams, args);
// },
// /**
//  * @param action restricted to OpencgaManager.actions.INFO, OpencgaManager.actions.FETCH
//  * @param queryParams required: sid (sessionId)
//  */
// get: function(resourceType, resourceId, action, queryParams, args) {
//     //        resourceId = "7";
//     _.extend(queryParams, {
//         sid: "RNk4P0ttFGHyqLA3YGS8",
//         view_as_pairs: 'false',
//         include_coverage: 'true',
//         process_differences: 'false'
//     });
//     this._call(resourceType, resourceId, action, queryParams, args);
// },
// /**
//  * @param queryParams required: sid (sessionId)
//  */
// list: function(resourceType, queryParams, args) {
//     this._call(resourceType, "", this.actions.LIST, queryParams, args);
// },
// /**
//  * @param queryParams required: sid (sessionId)
//  */
// update: function(resourceType, resourceId, queryParams, args) {
//     this._call(resourceType, resourceId, this.actions.UPDATE, queryParams, args);
// },
// /**
//  * @param queryParams required: sid (sessionId)
//  */
// delete: function(resourceType, resourceId, queryParams, args) {
//     this._call(resourceType, resourceId, this.actions.DELETE, queryParams, args);
// },
//
// _call: function(resourceType, resourceId, action, queryParams, args) {
//     var url = this._url(resourceType, resourceId, action, queryParams, args);
//
//     if (typeof url === 'undefined' || url == null) {
//         return;
//     }
//     console.log(url);
//     var async = (_.isUndefined(args.async) || _.isNull(args.async)) ? true: args.async;
//     var success = args.success;
//     var error = args.error;
//
//     var d;
//     $.ajax({
//         type: OpencgaManager.httpMethods[resourceType],
//         url: url,
//         dataType: 'json', //still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//         async: async,
//         success: function(data, textStatus, jqXHR) {
//             if ($.isPlainObject(data) || $.isArray(data)) {
//                 //                    data.params = args.params;
//                 //                    data.resource = args.resource;
//                 //                    data.category = args.category;
//                 //                    data.subCategory = args.subCategory;
//                 if (_.isFunction(success)) {
//                     success(data);
//                 }
//                 d = data;
//             } else {
//                 console.log('Cellbase returned a non json object or list, please check the url.');
//                 console.log(url);
//                 console.log(data)
//             }
//         },
//         error: function(jqXHR, textStatus, errorThrown) {
//             console.log("CellBaseManager: Ajax call returned : " + errorThrown + '\t' + textStatus + '\t' + jqXHR.statusText + " END");
//             if (_.isFunction(error)) {
//                 error(jqXHR, textStatus, errorThrown);
//             }
//         }
//     });
//     return url;
// },
//
// _url2: function(resourceType, resourceId, action, queryParams, args) {
//     if (resourceId == undefined || resourceId == null) {
//         resourceId = "";
//     } else {
//         resourceId = resourceId + "/";
//     }
//     var host = this.host;
//     if (typeof args.host !== 'undefined' && args.host != null) {
//         host = args.host;
//     }
//     var opencga = this.opencga;
//     if (typeof args.opencga !== 'undefined' && args.opencga != null) {
//         opencga = args.opencga;
//     }
//     /* still no version in the REST api
//      var version = this.version;
//      if(typeof args.version !== 'undefined' && args.version != null){
//      version = args.version
//      }
//      */
//     var url = host + opencga + resourceType + '/' + resourceId + action;
//     /*
//      _.extend(queryParams, {
//      sid: 'RNk4P0ttFGHyqLA3YGS8',
//      view_as_pairs: 'false',
//      include_coverage: 'true',
//      process_differences: 'false'
//      });*/
//
//     url = Utils.addQueryParamtersToUrl(queryParams, url);
//     return url;
// }

/*
 get: function (args) {
 var success = args.success;
 var error = args.error;
 var async = (_.isUndefined(args.async) || _.isNull(args.async) ) ? true : args.async;
 var urlConfig = _.omit(args, ['success', 'error', 'async']);

 var url = OpencgaManager.url(urlConfig);
 if(typeof url === 'undefined'){
 return;
 }
 console.log(url);

 var d;
 $.ajax({
 type: "GET",
 url: url,
 dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
 async: async,
 success: function (data, textStatus, jqXHR) {
 if($.isPlainObject(data) || $.isArray(data)){
 //                    data.params = args.params;
 //                    data.resource = args.resource;
 //                    data.category = args.category;
 //                    data.subCategory = args.subCategory;
 if (_.isFunction(success)) {
 success(data);
 }
 d = data;
 }else{
 console.log('Cellbase returned a non json object or list, please check the url.');
 console.log(url);
 console.log(data)
 }
 },
 error: function (jqXHR, textStatus, errorThrown) {
 console.log("CellBaseManager: Ajax call returned : " + errorThrown + '\t' + textStatus + '\t' + jqXHR.statusText + " END");
 if (_.isFunction(error)) error(jqXHR, textStatus, errorThrown);
 }
 });
 return d;
 },*/
//////// old version
//    host: (typeof OPENCGA_HOST === 'undefined') ? 'http://ws.bioinfo.cipf.es/opencga/rest' : OPENCGA_HOST,
//    getHost: function () {
//        return OpencgaManager.host;
//    },
//    setHost: function (hostUrl) {
//        OpencgaManager.host = hostUrl;
//    },
//    doGet: function (url, successCallback, errorCallback) {
//        $.ajax({
//            type: "GET",
//            url: url,
//            success: successCallback,
//            error: errorCallback
//        });
//    },
//    doPost: function (url, formData, successCallback, errorCallback) {
//        $.ajax({
//            type: "POST",
//            url: url,
//            data: formData,
//            processData: false,  // tell jQuery not to process the data
//            contentType: false,  // tell jQuery not to set contentType
//            success: successCallback,
//            error: errorCallback
//        });
//    },
//    getQuery: function (paramsWS) {
//        var query = "";
//        for (var key in paramsWS) {
//            if (paramsWS[key] != null)
//                query += key + '=' + paramsWS[key] + '&';
//        }
//        if (query != '')
//            query = "?" + query.slice(0, -1);
//        return query;
//    },
//
//
//    getAccountUrl: function (accountId) {
//        return OpencgaManager.getHost() + '/account/' + accountId;
//    },
//    getStorageUrl: function (accountId) {
//        return OpencgaManager.getAccountUrl(accountId) + '/storage';
//    },
//    getAdminProfileUrl: function (accountId) {
//        return OpencgaManager.getAccountUrl(accountId) + '/admin/profile';
//    },
//    getAdminBucketUrl: function (accountId, bucketId) {
//        return OpencgaManager.getAccountUrl(accountId) + '/admin/bucket/' + bucketId;
//    },
//    getAdminProjectUrl: function (accountId, projectId) {
//        return OpencgaManager.getAccountUrl(accountId) + '/admin/project/' + projectId;
//    },
//    getBucketUrl: function (accountId, bucketId) {
//        return OpencgaManager.getStorageUrl(accountId) + '/' + bucketId;
//    },
//    getObjectUrl: function (accountId, bucketId, objectId) {
//        return OpencgaManager.getStorageUrl(accountId) + '/' + bucketId + '/' + objectId;
//    },
//    getAnalysisUrl: function (accountId, analysis) {
//        return OpencgaManager.getAccountUrl(accountId) + '/analysis/' + analysis;
//    },
//    getJobAnalysisUrl: function (accountId, jobId) {
//        return OpencgaManager.getAccountUrl(accountId) + '/analysis/job/' + jobId;
//    },
//    getUtilsUrl: function () {
//        return OpencgaManager.getHost() + '/utils';
//    },
//    /*ACCOUNT METHODS*/
//    createAccount: function (args) {
////      accountId, email, name, password, suiteId
//        var queryParams = {
//            'name': args.name,
//            'email': args.email,
//            'password': args.password,
//            'suiteid': args.suiteId
//        };
//        var url = OpencgaManager.getAccountUrl(args.accountId) + '/create' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    login: function (args) {
////        accountId, password, suiteId
//        var queryParams = {
//            'password': args.password,
//            'suiteid': args.suiteId
//        };
//        var url = OpencgaManager.getAccountUrl(args.accountId) + '/login' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    logout: function (args) {
////        accountId, sessionId
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getAccountUrl(args.accountId) + '/logout' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    getAccountInfo: function (args) {
////        accountId, sessionId, lastActivity
////        console.log(args.lastActivity)
//        var queryParams = {
//            'last_activity': args.lastActivity,
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getAccountUrl(args.accountId) + '/info' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                if (data.response.errorMsg === '') {
//                    args.success(data.response.result[0]);
//                } else {
//                    $.cookie('bioinfo_sid', null);
//                    $.cookie('bioinfo_sid', null, {path: '/'});
//                    $.cookie('bioinfo_account', null);
//                    $.cookie('bioinfo_account', null, {path: '/'});
//                    console.log(data);
//                }
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    changePassword: function (args) {
////        accountId, sessionId, old_password, new_password1, new_password2
//        var queryParams = {
//            'old_password': args.old_password,
//            'new_password1': args.new_password1,
//            'new_password2': args.new_password2,
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getAdminProfileUrl(args.accountId) + '/change_password' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    resetPassword: function (args) {
////        accountId, email
//        var queryParams = {
//            'email': args.email
//        };
//        var url = OpencgaManager.getAdminProfileUrl(args.accountId) + '/reset_password' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    changeEmail: function (args) {
////        accountId, sessionId, new_email
//        var queryParams = {
//            'new_email': args.new_email,
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getAdminProfileUrl(args.accountId) + '/change_email' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//    /* BUCKET METHODS */
//    getBuckets: function () {
//        return 'TODO';
//    },
//
//    createBucket: function (args) {
////        bucketId, description, accountId, sessionId
//        var queryParams = {
//            'description': args.description,
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getAdminBucketUrl(args.accountId, args.bucketId) + '/create' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//    refreshBucket: function (args) {
////        accountId, bucketId, sessionId
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getAdminBucketUrl(args.accountId, args.bucketId) + '/refresh' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//    renameBucket: function (args) {
////        accountId, bucketId, newBucketId, sessionId
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getAdminBucketUrl(args.accountId, args.bucketId) + '/rename/' + args.newBucketId + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    deleteBucket: 'TODO',
//    shareBucket: 'TODO',
//
//    uploadObjectToBucket: function (args) {
////        accountId, sessionId, bucketId, objectId, formData, parents
//        var queryParams = {
//            'parents': (args.parents || false),
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getObjectUrl(args.accountId, args.bucketId, args.objectId) + '/upload' + OpencgaManager.getQuery(queryParams);
//        $.ajax({
//            type: "POST",
//            url: url,
//            data: args.formData,
//            processData: false,  // tell jQuery not to process the data
//            contentType: false,  // tell jQuery not to set contentType
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    createDirectory: function (args) {
////        accountId, sessionId, bucketId, objectId, parents
//        args.objectId = args.objectId.replace(new RegExp("/", "gi"), ":");
//        var queryParams = {
//            'parents': (args.parents || false),
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getObjectUrl(args.accountId, args.bucketId, args.objectId) + '/create_directory' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    deleteObjectFromBucket: function (args) {
////        accountId, sessionId, bucketId, objectId
//        args.objectId = args.objectId.replace(new RegExp("/", "gi"), ":");
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getObjectUrl(args.accountId, args.bucketId, args.objectId) + '/delete' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    pollObject: function (args) {
////       accountId, sessionId, bucketId, objectId
//        var queryParams = {
//            'start': args.start,
//            'limit': args.limit,
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getObjectUrl(args.accountId, args.bucketId, args.objectId) + '/poll' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            async: args.async,
//            success: function (data, textStatus, jqXHR) {
//                args.success(data);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    grepObject: function (args) {
////       accountId, sessionId, bucketId, objectId
//        var queryParams = {
//            'pattern': encodeURIComponent(args.pattern),
//            'ignoreCase': args.ignoreCase,
//            'multi': args.multi,
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getObjectUrl(args.accountId, args.bucketId, args.objectId) + '/grep' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            async: args.async,
//            success: function (data, textStatus, jqXHR) {
//                args.success(data);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//    region: function (args) {
////        accountId, sessionId, bucketId, objectId, region, queryParams
//        args.objectId = args.objectId.replace(new RegExp("/", "gi"), ":");
//        args.queryParams["sessionid"] = args.sessionId;
//        args.queryParams["region"] = args.region;
//        args.queryParams["cellbasehost"] = CELLBASE_HOST + '/' + CELLBASE_VERSION;
//
//        if (OpencgaManager.host.indexOf("localhost") != -1) {
//            args.queryParams["region"] = args.region;
//            args.queryParams["filepath"] = args.objectId;
//            var url = OpencgaManager.host + '/storage/fetch' + OpencgaManager.getQuery(args.queryParams);
//        } else {
//            var url = OpencgaManager.getObjectUrl(args.accountId, args.bucketId, args.objectId) + '/fetch' + OpencgaManager.getQuery(args.queryParams);
//        }
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
////                args.success(data.response);
//
////               TODO fix
//                if (!(data.substr(0, 5).indexOf('ERROR') != -1)) {
//                    var jsonData = JSON.parse(data);
//                    var r = {response: []};
//                    for (var i = 0; i < args.region.length; i++) {
//                        var result = jsonData[i];
//                        // TODO temporal fix
//                        r.response.push({
//                            id: args.region[i],
//                            result: jsonData[i]
//                        });
//                    }
//                    args.success(r);
////                args.success({resource: args.queryParams["category"], response: JSON.parse(data), filename: args.objectId, query: args.region, params: args.queryParams});
//                }
//
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//
//        function success(data) {
//
//        }
//    },
//
//    /* JOB METHODS */
//    jobResult: function (args) {
////        accountId, sessionId, jobId, format
//        //@Path("/{accountid}/{bucketname}/job/{jobid}/result.{format}")
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/result.js' + OpencgaManager.getQuery(queryParams);
//        //var url = OpencgaManager.getHost() + '/job/'+jobId+'/result.'+format+'?incvisites=true&sessionid='+sessionId;
//
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//
////        function success(data) {
////            args.success(data);
////        }
////
////        function error(data) {
////            if (_.isFunction(args.error)) args.error(data);
////        }
////
////        OpencgaManager.doGet(url, success, error);
////        console.log(url);
//    },
//    jobResultUrl: function (args) {
////        accountId, sessionId, jobId, format
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        return OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/result.js' + OpencgaManager.getQuery(queryParams);
//    },
//    jobStatus: function (args) {
////        accountId, sessionId, jobId
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/status' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//    table: function (args) {
////        accountId, sessionId, jobId, filename, colNames, colVisibility
//        var queryParams = {
//            'filename': args.filename,
//            'colNames': args.colNames,
//            'colVisibility': args.colVisibility,
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/table' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//    tableurl: function (args) {
////        accountId, sessionId, jobId, filename, colNames, colVisibility
//        var queryParams = {
//            'filename': args.filename,
//            'colNames': args.colNames,
//            'colVisibility': args.colVisibility,
//            'sessionid': args.sessionId
//        };
//        return OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/table' + OpencgaManager.getQuery(queryParams);
//    },
//
//    poll: function (args) {
////        accountId, sessionId, jobId, filename, zip
//        var queryParams = {
//            'filename': args.filename,
//            'sessionid': args.sessionId
//        };
//        var url;
//        if (args.zip == true) {
//            url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/poll' + OpencgaManager.getQuery(queryParams);
//            open(url);
//        } else {
//            queryParams['zip'] = false;
//            url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/poll' + OpencgaManager.getQuery(queryParams);
//
//            $.ajax({
//                type: "GET",
//                url: url,
//                async: args.async,
//                success: function (data, textStatus, jqXHR) {
//                    args.success(data);
//                },
//                error: function (jqXHR, textStatus, errorThrown) {
//                    if (_.isFunction(args.error)) args.error(jqXHR);
//                }
//            });
//        }
//    },
//
//    jobFileGrep: function (args) {
////        accountId, sessionId, jobId, filename, zip
//        var queryParams = {
//            'pattern': encodeURIComponent(args.pattern),
//            'ignoreCase': args.ignoreCase,
//            'multi': args.multi,
//            'filename': args.filename,
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/grep' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            async: args.async,
//            success: function (data, textStatus, jqXHR) {
//                args.success(data);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//
//    pollurl: function (args) {
////        accountId, sessionId, jobId, filename
//        var queryParams = {
//            'filename': args.filename,
//            'sessionid': args.sessionId,
//            'zip': false
//        };
//        return OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/poll' + OpencgaManager.getQuery(queryParams);
//        //debugger
//    },
//
//    deleteJob: function (args) {
////        accountId, sessionId, jobId
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/delete' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//    downloadJob: function (args) {
////        accountId, sessionId, jobId
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        open(OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/download' + OpencgaManager.getQuery(queryParams));
//    },
//
//    jobInfo: function (args) {
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/info' + OpencgaManager.getQuery(queryParams);
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//
//    /* ANALYSIS */
//    runAnalysis: function (args) {
////        analysis, paramsWS
//        var accountId = args.paramsWS.accountid;
//        var queryParams = {
////            'projectId':'default'
//        };
//        var url = OpencgaManager.getAnalysisUrl(accountId, args.analysis) + '/run' + OpencgaManager.getQuery(queryParams);
//        console.log(url);
//
//        $.ajax({
//            type: "POST",
//            url: url,
//            data: args.paramsWS,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    indexer: function (args) {
////        accountId, sessionId, bucketId, objectId
//        var queryParams = {
//            'sessionid': args.sessionId
//        };
//        var url = OpencgaManager.getObjectUrl(args.accountId, args.bucketId, args.objectId) + '/index' + OpencgaManager.getQuery(queryParams);
//        $.ajax({
//            type: "GET",
//            url: url,
//            dataType: 'json',//still firefox 20 does not auto serialize JSON, You can force it to always do the parsing by adding dataType: 'json' to your call.
//            success: function (data, textStatus, jqXHR) {
//                args.success(data.response);
//            },
//            error: function (jqXHR, textStatus, errorThrown) {
//                if (_.isFunction(args.error)) args.error(jqXHR);
//            }
//        });
//    },
//    indexerStatus: function (args) {
////        accountId, sessionId, bucketId, objectId, indexerId
//        var queryParams = {
//            'sessionid': args.sessionId,
//            'indexerid': args.indexerId
//        };
//        var url = OpencgaManager.getObjectUrl(args.accountId, args.bucketId, args.objectId) + '/index_status' + OpencgaManager.getQuery(queryParams);
//        console.log(url);
//
//        function success(data) {
//            args.success(data);
//        }
//
//        function error(data) {
//            if (_.isFunction(args.error)) args.error(data);
//        }
//
//        OpencgaManager.doGet(url, success, error);
//    },
//
//    localFileList: function (args) {
//
//        var url = OpencgaManager.host + '/getdirs';
//        console.log(url);
//
//        function success(data) {
//            args.success(data);
//        }
//
//        function error(data) {
//            if (_.isFunction(args.error)) args.error(data);
//        }
//
//        OpencgaManager.doGet(url, success, error);
//    },
//
//
//    /********/
//    /********/
//    /********/
//    /********/
//    /********/
//    // variation
//    variantsUrl: function (args) {
////        accountId, jobId
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/variantsMongo'
//        return url
//    },
//    variantInfoMongo: function (args) {
////        accountId, sessionId, jobId, filename
//        var queryParams = {
//            'sessionid': args.sessionId
////            'filename': args.filename
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/variantInfoMongo' + OpencgaManager.getQuery(queryParams);
//
//        function success(data) {
//            console.log(data);
//            args.success(data);
//        }
//
//        function error(data) {
//            if (_.isFunction(args.error)) args.error(data);
//        }
//
//        $.ajax({
//            type: "GET",
//            url: url,
//            async: args.async,
//            success: success,
//            error: error
//        });
//        //	console.log(url);
//    },
//
//
//    variant_effects: function (args) {
////        accountId, sessionId, jobId, filename
//        var queryParams = {
//            'sessionid': args.sessionId,
//            'filename': args.filename
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/variant_effects' + OpencgaManager.getQuery(queryParams);
//
//        function success(data) {
//            args.success(data);
//        }
//
//        function error(data) {
//            if (_.isFunction(args.error)) args.error(data);
//        }
//
//        $.ajax({
//            type: "POST",
//            url: url,
//            data: args.formData,
//            dataType: 'json',
//            success: success,
//            error: error
//        });
//
////        OpencgaManager.doPost(url, args.formData ,success, error);
//        //	console.log(url);
//    },
//    variantInfo: function (args) {
////        accountId, sessionId, jobId, filename
//        var queryParams = {
//            'sessionid': args.sessionId,
//            'filename': args.filename
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/variant_info' + OpencgaManager.getQuery(queryParams);
//
//        function success(data) {
//            console.log(data);
//            args.success(data);
//        }
//
//        function error(data) {
//            if (_.isFunction(args.error)) args.error(data);
//        }
//
//        OpencgaManager.doGet(url, success, error);
//        //	console.log(url);
//    },
//    variantStats: function (args) {
////        accountId, sessionId, jobId, filename
//        var queryParams = {
//            'sessionid': args.sessionId,
//            'filename': args.fileName
//        };
//        var url = OpencgaManager.getJobAnalysisUrl(args.accountId, args.jobId) + '/variant_stats' + OpencgaManager.getQuery(queryParams);
//
//        function success(data) {
//            args.success(data);
//        }
//
//        function error(data) {
//            if (_.isFunction(args.error)) args.error(data);
//        }
//
//        $.ajax({
//            type: "POST",
//            url: url,
//            data: args.formData,
//            dataType: 'json',
//            success: success,
//            error: error
//        });
//
////        OpencgaManager.doPost(url, args.formData ,success, error);
//        //	console.log(url);
//    }
// };

// OpencgaManager.httpMethods[OpencgaManager.actions.LOGIN] = "GET";
// OpencgaManager.httpMethods[OpencgaManager.actions.LOGOUT] = "GET";
// OpencgaManager.httpMethods[OpencgaManager.actions.CREATE] = "GET";
// OpencgaManager.httpMethods[OpencgaManager.actions.UPLOAD] = "POST";
// OpencgaManager.httpMethods[OpencgaManager.actions.INFO] = "GET";
// OpencgaManager.httpMethods[OpencgaManager.actions.LIST] = "GET";
// OpencgaManager.httpMethods[OpencgaManager.actions.FETCH] = "GET";
// OpencgaManager.httpMethods[OpencgaManager.actions.UPDATE] = "GET";
// OpencgaManager.httpMethods[OpencgaManager.actions.DELETE] = "GET";

class Region {

    constructor(args) {
        this.chromosome = null;
        this.start = null;
        this.end = null;

        this.chromosomeAlias = ["chromosome", "sequenceName"];
        if (_.isObject(args)) {
            this.load(args);
        } else if (_.isString(args)) {
            this.parse(args);
        }
    }

    load(obj) {
        if (_.isString(obj)) {
            return this.parse(obj);
        }
        this.chromosome = this._checkChromosomeAlias(obj) || this.chromosome;

        if (typeof obj.position !== "undefined") {
            obj.start = parseInt(obj.position);
            obj.end = obj.start;
        }

        (UtilsNew.isUndefinedOrNull(obj.start)) ? this.start = parseInt(this.start) : this.start = parseInt(obj.start);
        (UtilsNew.isUndefinedOrNull(obj.end)) ? this.end = parseInt(this.end) : this.end = parseInt(obj.end);
    }

    parse(str) {
        if (_.isObject(str)) {
            this.load(obj);
        }
        const pattern = /^([a-zA-Z0-9_])+\:([0-9])+\-([0-9])+$/;
        const pattern2 = /^([a-zA-Z0-9_])+\:([0-9])+$/;
        if (pattern.test(str) || pattern2.test(str)) {
            const splitDots = str.split(":");
            if (splitDots.length === 2) {
                const splitDash = splitDots[1].split("-");
                this.chromosome = splitDots[0];
                this.start = parseInt(splitDash[0]);
                if (splitDash.length === 2) {
                    this.end = parseInt(splitDash[1]);
                } else {
                    this.end = this.start;
                }
            }
            return true;
        }
        return false;
    }

    multiParse(str) {
        if (_.isObject(str)) {
            this.load(obj);
        }
        const pattern = /^([a-zA-Z0-9_])+\:([0-9])+\-([0-9])+(,([a-zA-Z0-9_])+\:([0-9])+\-([0-9])+)*$/;
        const pattern2 = /^\[([a-zA-Z0-9_])+\:([0-9])+\-([0-9])+(,([a-zA-Z0-9_])+\:([0-9])+\-([0-9])+)*\]$/;

        let withoutBrackets = str;
        if (pattern2.test(str)) {
            withoutBrackets = str.slice(1, str.length - 1);
        }

        const regions = [];
        if (pattern.test(withoutBrackets)) {
            const splitRegions = withoutBrackets.split(",");
            for (let i = 0; i < splitRegions.length; i++) {
                regions.push(new Region(splitRegions[i]));
            }
        }
        return regions;
    }

    center() {
        return this.start + Math.floor((this.length()) / 2);
    }

    length() {
        return this.end - this.start + 1;
    }

    equals(r) {
        return (this.chromosome === r.chromosome && this.start === r.start && this.end === r.end);
    }

    toString(formatted) {
        let str;
        if (formatted === true) {
            str = `${this.chromosome}:${Utils.formatNumber(this.start)}-${Utils.formatNumber(this.end)}`;
        } else {
            str = `${this.chromosome}:${this.start}-${this.end}`;
        }
        return str;
    }

    _checkChromosomeAlias(obj) {
        for (let i = 0; i < this.chromosomeAlias.length; i++) {
            const alias = this.chromosomeAlias[i];
            if (alias in obj) {
                return obj[alias];
            }
        }
    }

}


/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

// Element.prototype.addChildSVG = function(elementName, attributes, index){
//	var el = document.createElementNS('http://www.w3.org/2000/svg', elementName);
//	for ( var key in attributes){
//		el.setAttribute(key, attributes[key]);
//	}
//	
//	// insert child at requested index, or as last child if index is too high or no index is specified
//    if ( null == index ) {
//      this.appendChild( el );
//    }
//    else {
//      var targetIndex = index + 1;
//      if ( 0 == index ) {
//        targetIndex = 0;
//      }
//      var targetEl = this.childNodes[ targetIndex ];
//      if ( targetEl ) {
//        this.insertBefore( el, targetEl ); 
//      }
//      else {
//        this.appendChild( el );
//      }
//    }
//    return el;
// };
// Element.prototype.initSVG = function(attributes){
//	return this.addChildSVG("svg", attributes);
// };

const SVG = {

    create(elementName, attributes) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", elementName);
        for (const key in attributes) {
            el.setAttribute(key, attributes[key]);
        }
        return el;
    },

    addChild(parent, elementName, attributes, index) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", elementName);
        for (const key in attributes) {
            el.setAttribute(key, attributes[key]);
        }
        return this._insert(parent, el, index);
    },

    addChildImage(parent, attributes, index) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", "image");
        for (const key in attributes) {
            if (key == "xlink:href") {
                el.setAttributeNS("http://www.w3.org/1999/xlink", "href", attributes[key]);
            } else {
			    el.setAttribute(key, attributes[key]);
            }
        }
        return this._insert(parent, el, index);
    },

    _insert(parent, el, index) {
    // insert child at requested index, or as last child if index is too high or no index is specified
	    if (index == null) {
	    	parent.appendChild(el);
	    } else {
	      let targetIndex = index + 1;
	      if (index == 0) {
	        targetIndex = 0;
	      }
	      const targetEl = parent.childNodes[targetIndex];
	      if (targetEl) {
	    	  parent.insertBefore(el, targetEl);
	      } else {
	    	  parent.appendChild(el);
	      }
	    }
	    return el;
    },

    init(parent, attributes) {
        return this.addChild(parent, "svg", attributes);
    },


    //
    /* Functions to generate arcs with PATH element  */
    //

    _polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians)),
        };
    },

    describeArc(x, y, radius, startAngle, endAngle) {
        const start = this._polarToCartesian(x, y, radius, endAngle);
        const end = this._polarToCartesian(x, y, radius, startAngle);

        const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
        const d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
        ].join(" ");

        return d;
    },
};

// createSVG = function(elementName, attributes){
//	var el = document.createElementNS('http://www.w3.org/2000/svg', elementName);
//	for ( var key in attributes){
//		el.setAttribute(key, attributes[key]);
//	}
//	return el;
// };


// var SVG =
// {
//		svgns : 'http://www.w3.org/2000/svg',
//		xlinkns : "http://www.w3.org/1999/xlink",
//
// //	createSVGCanvas: function(parentNode, attributes)
// //	{
// ////		attributes['xmlns'] = SVG.svgns;
// ////		attributes['xmlns:xlink'] = SVG.xlinkns;
// ////		attributes.push( ['xmlns', SVG.svgns], ['xmlns:xlink', 'http://www.w3.org/1999/xlink']);
// //		var svg = document.createElementNS(SVG.svgns, "svg");
// //		
// //		for ( var key in attributes){
// //			svg.setAttribute(key, attributes[key]);
// //		}
// //		
// //		parentNode.appendChild(svg);
// //		return svg;
// //	}, 
//	
//	//Shape types : rect, circle, ellipse, line, polyline, polygon , path
//	createElement : function (svgNode, shapeName, attributes) {
//		try{
//			if(attributes.width < 0){
//				console.log("BIOINFO Warn: on SVG.createRectangle: width is negative, will be set to 0");
//				attributes.width=0;
//			}
//			if(attributes.height < 0){
//				console.log("BIOINFO Warn: on SVG.createRectangle: height is negative, will be set to 0");
//				attributes.height=0;
//			}
//			
//			var shape = document.createElementNS('http://www.w3.org/2000/svg', shapeName);
//			for ( var key in attributes){
//				shape.setAttribute(key, attributes[key]);
//			}
//			svgNode.appendChild(shape);
//		}
//		catch(e){
//			console.log("-------------------- ");
//			console.log("Error on drawRectangle " + e);
//			console.log(attributes);
//			console.log("-------------------- ");
//		}
//		return shape;
//	}
// };
//
//
//
// var CanvasToSVG = {
//		
//	convert: function(sourceCanvas, targetSVG, x, y, id, attributes) {
//		
//		var img = this._convert(sourceCanvas, targetSVG, x, y, id);
//		
//		for (var i=0; i< attributes.length; i++)
//		{
//			img.setAttribute(attributes[i][0], attributes[i][1]);
//		}
//	},
//	
//	_convert: function(sourceCanvas, targetSVG, x, y, id) {
//		var svgNS = "http://www.w3.org/2000/svg";
//		var xlinkNS = "http://www.w3.org/1999/xlink";
//		// get base64 encoded png from Canvas
//		var image = sourceCanvas.toDataURL();
//
//		// must be careful with the namespaces
//		var svgimg = document.createElementNS(svgNS, "image");
//
//		svgimg.setAttribute('id', id);
//	
//		//svgimg.setAttribute('class', class);
//		//svgimg.setAttribute('xlink:href', image);
//		svgimg.setAttributeNS(xlinkNS, 'xlink:href', image);
//		
//
//		svgimg.setAttribute('x', x ? x : 0);
//		svgimg.setAttribute('y', y ? y : 0);
//		svgimg.setAttribute('width', sourceCanvas.width);
//		svgimg.setAttribute('height', sourceCanvas.height);
//		//svgimg.setAttribute('cursor', 'pointer');
//		svgimg.imageData = image;
//	
//		targetSVG.appendChild(svgimg);
//		return svgimg;
//	},
//	
//	importSVG: function(sourceSVG, targetCanvas) {
//	    svg_xml = sourceSVG;//(new XMLSerializer()).serializeToString(sourceSVG);
//	    var ctx = targetCanvas.getContext('2d');
//
//	    var img = new Image();
//	    img.src = "data:image/svg+xml;base64," + btoa(svg_xml);
// //	    img.onload = function() {
//	        ctx.drawImage(img, 0, 0);
// //	    };
//	}
//	
// };
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

var Utils = {
    // properties
    characters: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    number: {
        sign(x) {
            return x ? x < 0 ? -1 : 1 : 0;
        },
    },
    // Methods
    formatNumber(position) {
        return position.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    },
    formatText(text, spaceChar) {
        let _text = text.replace(new RegExp(spaceChar, "gi"), " ");
        _text = _text.charAt(0).toUpperCase() + _text.slice(1);
        return _text;
    },
    titleCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    camelCase(str) {
        return str.toLowerCase().replace(/[.-_\s](.)/g, (match, group1) => group1.toUpperCase());
    },
    camelToSpace(str) {
        const result = str.replace(/([A-Z])/g, " $1").toLowerCase().trim();
        return result.charAt(0).toUpperCase() + result.slice(1);
    },
    closest(element, selector) {
        const matches = (element.matches) ? "matches" : "msMatchesSelector";
        while (element) {
            if (element[matches](selector)) {
                break;
            }
            element = element.parentElement;
        }
        return element;
    },
    isFunction(s) {
        return typeof (s) === "function" || s instanceof Function;
    },
    parseDate(strDate) {
        return `${strDate.substring(4, 6)}/${strDate.substring(6, 8)}/${strDate.substring(0, 4)} ${strDate.substring(8, 10)}:${strDate.substring(10, 12)}:${strDate.substring(12, 14)}`;
    },
    genId(prefix) {
        let _prefix = prefix || "";
        _prefix = prefix.length == 0 ? prefix : `${prefix}-`;
        return _prefix + this.randomString(4) + this.getRandomInt(1000, 9999);
    },
    randomString(length) {
        const _length = length || 10;
        let str = "";
        for (let i = 0; i < _length; i++) {
            str += this.characters.charAt(this.getRandomInt(0, this.characters.length - 1));
        }
        return str;
    },
    getRandomInt(min, max) {
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/random
    // Using Math.round() will give you a non-uniform distribution!
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    endsWithIgnoreCase(str, test) {
        const regex = new RegExp(`^.*\\.(${test})$`, "i");
        return regex.test(str);
    },
    endsWith(str, test) {
        return str.length >= test.length && str.substr(str.length - test.length) == test;
    },
    addQueryParamtersToUrl(paramsWS, url) {
        let chr = "?";
        if (url.indexOf("?") != -1) {
            chr = "&";
        }
        let query = Utils.queryString(paramsWS);
        if (query !== "") { query = chr + query; }
        return url + query;
    },
    queryString(obj) {
        const items = [];
        for (const key in obj) {
            if (obj[key] != null && obj[key] != undefined) {
                items.push(`${key}=${encodeURIComponent(obj[key])}`);
            }
        }
        return items.join("&");
    },
    randomColor() {
        let color = "";
        for (let i = 0; i < 6; i++) {
            color += ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "a", "b", "c", "d", "e", "f"][Math.floor(Math.random() * 16)]);
        }
        return `#${color}`;
    },
    colorLuminance(hex, lum) {
    // validate hex string
        let _hex = String(hex).replace(/[^0-9a-f]/gi, "");
        _hex = String(hex).replace(/#/gi, "");
        if (_hex.length < 6) {
            _hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        let _lum = lum || 0;

        // convert to decimal and change luminosity
        let rgb = "#";
        let c;
        let i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * _lum)), 255)).toString(16);
            rgb += (`00${c}`).substr(c.length);
        }

        return rgb;
    },
    getSpeciesFromAvailable(availableSpecies, speciesCode) {
        for (const phylos in availableSpecies) {
            for (let i = 0; i < availableSpecies[phylos].length; i++) {
                const species = availableSpecies[phylos][i];
                if (species.id === speciesCode || species.scientificName.toLowerCase() === speciesCode.toLowerCase()) {
                    return species;
                }
            }
        }
        return [];
    },
    getSpeciesCode(speciesName) {
        const pair = speciesName.split(" ");
        let code;
        if (pair.length < 3) {
            code = (pair[0].charAt(0) + pair[1]).toLowerCase();
        } else {
            code = (pair[0].charAt(0) + pair[1] + pair[pair.length - 1].replace(/[/_().\-]/g, "")).toLowerCase();
        }
        return code;
    },
    basicValidationForm(scope) {
        let validated = true;
        let msg = "";
        if (scope.$.outdir.selectedFile === undefined || scope.$.outdir.selectedFile.type != "FOLDER") {
            msg += "Error: Please select an output folder.\n";
            validated = false;
        }
        if (scope.$.inputFile.selectedFile === undefined || scope.$.inputFile.selectedFile.type != "FILE") {
            msg += "Error: Please select an input file.\n";
            validated = false;
        }
        if (scope.$.jobName.value === "") {
            msg += "Error: Please add a job name.\n";
            validated = false;
        }
        if (!validated) {
            alert(msg);
        }
        return validated;
    },
    getUrl(fileId) {
        return OpencgaManager.files.download({
            id: fileId,
            query: {
                sid: Cookies("bioinfo_sid"),
            },
            request: {
                url: true,
            },
        });
    },
    getFileContent(callback, fileId) {
        OpencgaManager.files.content({
            id: fileId,
            query: {
                sid: Cookies("bioinfo_sid"),
            },
            request: {
                success(response) {
                    callback(response);
                },
                error() {
                    this.message = "Server error, try again later.";
                },
            },
        });
    },
    loadExampleFile(callback, toolName, exampleFileName) {
        const me = this;
        OpencgaManager.files.contentExample({
            query: {
                toolName,
                fileName: exampleFileName,
            },
            request: {
                // method: 'POST',
                success(response) {
                    callback(response);
                    //                            debugger
                    //                            me.loadedMainSelectChanged(false,true);
                },
                error() {
                    console.log("utils.js223:Server error, try again later.");
                },
            },
        });
    },
    downloadExampleFile(toolName, fileName) {
        const url = OpencgaManager.files.downloadExample({
            query: {
                toolName,
                fileName,
            },
            request: {
                url: true,
            },
        });
        const link = document.createElement("a");
        link.href = url;
        // link.setAttribute("download", "download.zip");
        const event = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });
        link.dispatchEvent(event);
    },
    argsParser(form, args) {
        if (form.toolName == args.tool) {
            for (const key in args) {
                if (typeof (args[key]) === "object") {
                    if (form.$[key] !== undefined) { form.$[key].selectedFile = args[key]; }
                } else {
                    const elems = form.shadowRoot.querySelectorAll(`input[name="${key}"]`);
                    if (form.$[key] !== undefined) {
                        switch (form.$[key].type) {
                        case "checkbox":
                            form.$[key].checked = args[key];
                        default:
                            form.$[key].value = args[key];
                        }
                    }
                    for (let i = 0; i < elems.length; i++) {
                        const elem = elems[i];
                        if (elem.value == args[key]) { elem.checked = true; }
                    }
                }
            }
        }
    },
    getLinks(terms) {
        const links = [];
        for (let i = 0; i < terms.length; i++) {
            const term = terms[i];
            links.push(Utils.getLink(term));
        }
        return links;
    },
    getLink(term) {
        let link = "http://www.ebi.ac.uk/QuickGO/GTerm?id=";
        if (term.indexOf("(") >= 0) {
            var id = term.split("(");
            if (id.length > 1) { id = id[1]; }
            id = id.split(")")[0];
        } else { id = term; }
        if (id.indexOf("IPR") == 0) { link = "http://www.ebi.ac.uk/interpro/entry/"; }
        link += id;
        return link;
    },
    myRound(value, decimals) {
        const _decimals = typeof decimals !== "undefined" ? decimals : 2;
        let _value = parseFloat(value);
        /** rounding * */
        if (Math.abs(value) >= 1) { _value = value.toFixed(_decimals); } else { _value = value.toPrecision(_decimals); }
        _value = parseFloat(value);
        return _value;
    },
    formatNumber(value, decimals) {
        value = Utils.myRound(value, decimals);

        if (Math.abs(value) > 0 && Math.abs(value) < 0.001) { value = value.toExponential(); }
        return value;
    },
    getSpecies(specieValue, species) {
        for (let i = 0; i < species.length; i++) {
            const specie = species[i];
            if (specie.value == specieValue) {
                return specie;
            }
        }
        return null;
    },
    test() {
        return this;
    },
    cancelFullscreen() {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    },
    launchFullScreen(element) {
        if (element.requestFullScreen) {
            element.requestFullScreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullScreen) {
            element.webkitRequestFullScreen();
        }
    },
    parseJobCommand(item) {
        const commandObject = {};
        const commandArray = item.commandLine.split(/ -{1,2}/g);
        let tableHtml = "<table cellspacing=\"0\" style=\"max-width:400px;border-collapse: collapse;border:1px solid #ccc;\"><tbody>";
        tableHtml += "<tr style=\"border-collapse: collapse;border:1px solid #ccc;font-weight:bold;\">";
        tableHtml += "<td style=\"min-width:50px;border-collapse: collapse;border:1px solid #ccc;padding: 5px;background-color: whiteSmoke;\">Parameter</td>";
        tableHtml += "<td style=\"border-collapse: collapse;border:1px solid #ccc;padding: 5px;background-color: whiteSmoke;\">Value</td>";
        tableHtml += "</tr>";
        for (let i = 1; i < commandArray.length; i++) {
            // ignore first argument
            const paramenter = commandArray[i];
            const paramenterArray = paramenter.split(/ {1}/g);
            let name = "";
            let value = "";
            if (paramenterArray.length < 2) {
                name = paramenterArray[0];
                value = "<span color:darkgray;font-weight:bold;>This paramenter is a flag</span>";
            } else {
                name = paramenterArray[0];
                value = paramenterArray[1];
            }
            commandObject[name] = value;
            /* clean values for viz */
            value = value.replace(/\/httpd\/bioinfo\/opencga\/analysis\/.+\/examples\//, "");
            value = value.replace("/httpd/bioinfo/opencga/accounts/", "");
            value = value.replace(/,/g, ", ");

            tableHtml += "<tr style=\"border-collapse: collapse;border:1px solid #ccc;\">";
            tableHtml += `<td style="border-collapse: collapse;border:1px solid #ccc;padding: 5px;background-color: whiteSmoke;color:steelblue;font-weight:bold;white-space: nowrap;">${name}</td>`;
            tableHtml += `<td style="border-collapse: collapse;border:1px solid #ccc;padding: 5px;background-color: whiteSmoke;">${value}</td>`;
            tableHtml += "</tr>";
        }
        tableHtml += "</tbody></table>";
        return {
            html: tableHtml,
            data: commandObject,
        };
    },
    htmlTable(object) {
        let tableHtml = "";
        tableHtml += "<table cellspacing=\"0\" style=\"border-collapse: collapse;border:1px solid #ccc;\"><tbody>";
        for (const key in object) {
            tableHtml += "<tr style=\"border-collapse: collapse;border:1px solid #ccc;\">";
            tableHtml += `<td style="border-collapse: collapse;border:1px solid #ccc;padding: 5px;background-color: whiteSmoke;color:steelblue;font-weight:bold;white-space: nowrap;">${key}</td>`;
            tableHtml += `<td style="border-collapse: collapse;border:1px solid #ccc;padding: 5px;background-color: whiteSmoke;">${object[key]}</td>`;
            tableHtml += "</tr>";
        }
        tableHtml += "</tbody></table>";
        return tableHtml;
    },
    msg(title, msg) {
        let div = document.createElement("div");
        div.classList.add("jso-msg-hidden");
        const titleDiv = document.createElement("div");
        titleDiv.textContent = title;
        const msgDiv = document.createElement("div");
        msgDiv.textContent = msg;
        div.appendChild(titleDiv);
        div.appendChild(msgDiv);
        document.body.appendChild(div);
        div.addEventListener("click", () => {
            document.body.removeChild(div);
            div = null;
        });
        setTimeout(() => {
            div.classList.add("jso-msg-shown");
        }, 10);
        setTimeout(() => {
            if (div) {
                div.classList.remove("jso-msg-shown");
            }
        }, 4000);
        setTimeout(() => {
            if (div) {
                document.body.removeChild(div);
                div = null;
            }
        }, 4400);
    },
    repeat(string, count) {
        if (string == null) {
            throw new TypeError(`can't convert ${string} to object`);
        }
        let str = `${string}`;
        count = +count;
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError("repeat count must be non-negative");
        }
        if (count == Infinity) {
            throw new RangeError("repeat count must be less than infinity");
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return "";
        }
        // Ensuring count is a 31-bit integer allows us to heavily optimize the
        // main part. But anyway, most current (august 2014) browsers can't handle
        // strings 1 << 28 chars or longer, so:
        if (str.length * count >= 1 << 28) {
            throw new RangeError("repeat count must not overflow maximum string size");
        }
        let rpt = "";
        for (;;) {
            if ((count & 1) == 1) {
                rpt += str;
            }
            count >>>= 1;
            if (count == 0) {
                break;
            }
            str += str;
        }
        return rpt;
    },
    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    timeDiff(timeStart, timeEnd) {
        const ts = new Date(Date.parse(timeStart));
        const te = new Date(Date.parse(timeEnd));

        if (isNaN(ts) || isNaN(te)) {
            return "";
        }
        let milisecDiff = 0;
        if (ts < te) {
            milisecDiff = te - ts;
        } else {
            milisecDiff = ts - te;
        }

        const days = Math.floor(milisecDiff / 1000 / 60 / (60 * 24));
        let daysMessage = `${days} Days `;
        if (days === 0) {
            daysMessage = "";
        }
        const dateDiff = new Date(milisecDiff);
        const hours = dateDiff.getHours() - 1;
        let hoursMessage = `${hours} hour`;
        let minutesMessage = `${dateDiff.getMinutes()} minute`;
        let secondsMessage = `${dateDiff.getSeconds()} second`;
        if (hours !== 1) {
            hoursMessage += "s ";
        } else {
            hoursMessage += " ";
        }
        if (dateDiff.getMinutes() !== 1) {
            minutesMessage += "s ";
        } else {
            minutesMessage += " ";
        }
        if (dateDiff.getSeconds() !== 1) {
            secondsMessage += "s ";
        } else {
            secondsMessage += " ";
        }
        if (hours === 0) {
            hoursMessage = "";
        }
        if (dateDiff.getMinutes() === 0) {
            minutesMessage = "";
        }
        if (dateDiff.getSeconds() === 0) {
            secondsMessage = "";
        }
        return daysMessage + hoursMessage + minutesMessage + secondsMessage;
    },
    deleteIndexedDB() {
        window.indexedDB.webkitGetDatabaseNames().onsuccess = function (sender, args) {
            const r = sender.target.result;
            for (const i in r) {
                indexedDB.deleteDatabase(r[i]);
            }
        };
    },
    subsetArray(array, from, to) {
        const aux = [];
        from = (from < 0) ? 0 : from;
        to = (to >= array.length) ? array.length : to;

        for (let i = from; i < to; i++) {
            aux.push(array[i]);
        }

        return aux;
    },
    applyFunctionBatch(array, batchsize, callback) {
        let end = batchsize;
        let auxArray = this.subsetArray(array, 0, end);

        while (auxArray.length > 0) {
            callback(auxArray);
            auxArray = this.subsetArray(array, end, end + batchsize);
            end += batchsize;
        }
    },

};

Utils.images = {
    add: "data:image/gif;base64,R0lGODlhEAAQAIcAAD2GNUKNNkOPOESMO0WNPEmPP0iNQUmPQlOVTFWWTVCZQVeeRV6cVmGeWGSgVWSgV2aiWGejW2WrVWirU2uqWGqsW2yqWm61WG+1WG+1WXS3W3S3XHC4WXK5W3O6XHG+X3asZ3iuaHe8YHi0ZH+yany6ZH28Zn2+Z3m9bn25an25a3+5bUD/QHDBY3nBZHrGa3zDa37BaX7Hb4K1boO1boa3cYi4d4y7doq5eYm+eI2+e5O/f4HMdYbJeobJfIXNeYrCeY/CfYnIf4rPfZW/gozLgY7MhI7Sg5LFgJXAgpfHhZfMhZPNiJjLhpjMh5jMipvBl5vBmJTTipbTiZXUipbUi5fVi5nRi53YkqTOlKbPlqbQlqDZlaDZlqXbm6rUnavUnKbIoKfJoa/fpa/fprPZpbTZpbTaprLbqLPdqbXbqLfaqrTdqrXfrLbdrLjVr7jdr7vcr7rWsbfgr77itr3ktsTcuMXducXowMvmw87pydTrz9fu0tzx2ODy3P///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAMAACwALAAAAAAQABAAAAi/AFkIHEiwoME7SWrMwCHH4MAdWfLs0QNnRQiHN+L4qeOlyxg8QCAU3LGmDxYmRqpQOTJHRYSBdpTw4SJFyJ8/P2DIaLNAjEAibsgU8YHiZgURHq4gaSCQBh0rPW5K/cMhxpcCAkmkGcJj6k0OJ8AMEGjjyZQXLSR85dBhiY4EAt9MYOPig4ivFzacEQBlIIgUaJByyIBBQxkLBwo6GKHGiYkSTcxQAODwgYIgW7TkCGDAocAwDAoQQBDFs2mCAQEAOw==",
    del: "data:image/gif;base64,R0lGODlhEAAQAIcAAED/QLpSNL9TOr5WOb5cQL9cQMFNM8RQNMBVPcBZP8xSPNBPPttWS9ddUcJnTMRkTMdrVM1gUc5iVMxmVclrVs1oWNZgVNZuZNtpZdxraN5ratxuadRxZd14c955dOZWTOZYTOZZTulZTelbT+ZWUOZaUuddWepcUOxfVOBlXO5mUuljW+pmXO5qXvBkVvNzXeNrYeNuY+FvcOJwZuJ7deR4ceJ5eeN4eeJ/feN/fOl7cOh6del/ePJ3Y/N5Y+qDfe6Efe+Gfu6KdfaCaPaEbPCFcPCDe/CMd/GOeviGcPiMdvCRf/eRfveTfvmSfvqTf/iUf9ymltynl+6Mge2Tju6Sj/SOgfqah/qdi/GclvGdluGpnvSgnvSinvWjn/qjkfupnPqrneGroOqwrOuzr/Ono/WmoferofarovWsofWvpfKtqvivpPS0qvi2qPm5r/q6rvC1tfC2tvjDvvzHuvnLxPnTzPzUzf3b1P3c2P///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAMAAAAALAAAAAAQABAAAAi6AAEIHEiwoEE5ODRk8EDG4EAbVObYqdNmxgWHMtbkgfMFCxg6OiQUvFEGz5UlSKA4UeImRoWBcX7cwdJECJGbRHywWSBGYA41YY6gGEq0hxUeFARuePOkiJ6nUEW00IJAIIYzSYZAjcoiywCBHaYweSGirNkRRmg8EDiGARoXKsyKAFHCy4EoAznASIPihIgQH0h0sVCgYIQUZoKsMAGES4MADico2FGlSg0DBBwK3AIhgQAHUjSLJhgQADs=",
    enable: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAKfSURBVDjLpZPrS1NhHMf9O3bOdmwDCWREIYKEUHsVJBI7mg3FvCxL09290jZj2EyLMnJexkgpLbPUanNOberU5taUMnHZUULMvelCtWF0sW/n7MVMEiN64AsPD8/n83uucQDi/id/DBT4Dolypw/qsz0pTMbj/WHpiDgsdSUyUmeiPt2+V7SrIM+bSss8ySGdR4abQQv6lrui6VxsRonrGCS9VEjSQ9E7CtiqdOZ4UuTqnBHO1X7YXl6Daa4yGq7vWO1D40wVDtj4kWQbn94myPGkCDPdSesczE2sCZShwl8CzcwZ6NiUs6n2nYX99T1cnKqA2EKui6+TwphA5k4yqMayopU5mANV3lNQTBdCMVUA9VQh3GuDMHiVcLCS3J4jSLhCGmKCjBEx0xlshjXYhApfMZRP5CyYD+UkG08+xt+4wLVQZA1tzxthm2tEfD3JxARH7QkbD1ZuozaggdZbxK5kAIsf5qGaKMTY2lAU/rH5HW3PLsEwUYy+YCcERmIjJpDcpzb6l7th9KtQ69fi09ePUej9l7cx2DJbD7UrG3r3afQHOyCo+V3QQzE35pvQvnAZukk5zL5qRL59jsKbPzdheXoBZc4saFhBS6AO7V4zqCpiawuptwQG+UAa7Ct3UT0hh9p9EnXT5Vh6t4C22QaUDh6HwnECOmcO7K+6kW49DKqS2DrEZCtfuI+9GrNHg4fMHVSO5kE7nAPVkAxKBxcOzsajpS4Yh4ohUPPWKTUh3PaQEptIOr6BiJjcZXCwktaAGfrRIpwblqOV3YKdhfXOIvBLeREWpnd8ynsaSJoyESFphwTtfjN6X1jRO2+FxWtCWksqBApeiFIR9K6fiTpPiigDoadqCEag5YUFKl6Yrciw0VOlhOivv/Ff8wtn0KzlebrUYwAAAABJRU5ErkJggg==",
    warning: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIsSURBVDjLpVNLSJQBEP7+h6uu62vLVAJDW1KQTMrINQ1vPQzq1GOpa9EppGOHLh0kCEKL7JBEhVCHihAsESyJiE4FWShGRmauu7KYiv6Pma+DGoFrBQ7MzGFmPr5vmDFIYj1mr1WYfrHPovA9VVOqbC7e/1rS9ZlrAVDYHig5WB0oPtBI0TNrUiC5yhP9jeF4X8NPcWfopoY48XT39PjjXeF0vWkZqOjd7LJYrmGasHPCCJbHwhS9/F8M4s8baid764Xi0Ilfp5voorpJfn2wwx/r3l77TwZUvR+qajXVn8PnvocYfXYH6k2ioOaCpaIdf11ivDcayyiMVudsOYqFb60gARJYHG9DbqQFmSVNjaO3K2NpAeK90ZCqtgcrjkP9aUCXp0moetDFEeRXnYCKXhm+uTW0CkBFu4JlxzZkFlbASz4CQGQVBFeEwZm8geyiMuRVntzsL3oXV+YMkvjRsydC1U+lhwZsWXgHb+oWVAEzIwvzyVlk5igsi7DymmHlHsFQR50rjl+981Jy1Fw6Gu0ObTtnU+cgs28AKgDiy+Awpj5OACBAhZ/qh2HOo6i+NeA73jUAML4/qWux8mt6NjW1w599CS9xb0mSEqQBEDAtwqALUmBaG5FV3oYPnTHMjAwetlWksyByaukxQg2wQ9FlccaK/OXA3/uAEUDp3rNIDQ1ctSk6kHh1/jRFoaL4M4snEMeD73gQx4M4PsT1IZ5AfYH68tZY7zv/ApRMY9mnuVMvAAAAAElFTkSuQmCC",
    edit: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB80lEQVR42o2T30tTURzArb8ioiAI6kHoZeF7CGE/IISCUDNCqAeL3rIWPfSwByskYUEJIhSChBhJFAiNqMVYPqRuc4tcW3NLt3C7u3d3d3c/+nS+0GRK0134cC6c8/ncc+7ltgFt6jqgcCg6duGQYq84deoBR6lU0iqVSq1arfI/1Dxut3u0Htke6BC5UChgmuYm+XyeXC5HOp1GIsnQNJHJi3x/7WJh/CSLT9r7Rd4jAVlgWRa2bSOjYBgGmqaRyWQwkq9Y8wyhLb0BI0VuaRrfo671xoDIwmakWCyi6zrr36bILt/HXp1l7cNDioEZqnEvgYmr1paAOgYy1u/l3NrqHNngPWpFL8XodTa+3CD8YoCvz/o078i5o1sC29FT78kG7lCzfJgrl7ESvejLThLPuxk8fbhP3KaBVFCdeX7on9yP9bOHfPAu0bEzmKkg4jQNpEKzhOduqW1/xIoNUEpcQlM7WXl6Cj39Q9Y0D4Q/TRJ662Tx3WOS/guYsV42Fm4THe/G/B2T97Jz4OVwJ+hxImPn8Tj381k91TfShfErIvLuAde1Y9g+N7Z/FL/rBDODR8gmgpTL5To7B3o69zF8pR3Pg7PMT90kn47LJ22kaeCPghapidP4Lxy3bduUiVZktdaQH7AxcFAiUm0Rhzji/gUhbp0s2Zf2xwAAAABJRU5ErkJggg==",
    info: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAJ1SURBVHjafJJdSJNhFMd/z3QzLWdZrnQmSA2DPqRCK4KuhIq66kLoAy/qoqCguqqL6JsgLwoKKhCMSIy6CDKKRFZZYYQRVhJl02nWmG5uc19u7/vuPV0lW7QOnIsHnt+P8z/Pg4gw26aZ0263uzEUCn2IxWJjXq/3JqBETLIZ8gkePLhfKyKy/Z5HHJf7xe0Jic/n65mejizPK0inUiSTKUSE0dHRhxf6JoSDb4Rjr4QDz0REJBgMtmczFrJKKYVSCjCYnPR/W1FuAwQSGjbHXAA0LRXKZnIm0NJpgAKvd/hSOBz2iIj0eiPS2vtDYsmUPH/uPg9YshklIrOyCb+/eUG5ve3au5C99W2AqGbgKivk8R4X1lSkv2pJZaNmmBQVWWeZnAiGoa+3KovdyBjsW2kn/SvK4Jcgtaf7cDqrGkQMUDkBcgXVS2tOHjp8dG2jOXT1yo5lYOpgFTB0wKTAOqdQMlqOoDD7EE8kREwGXr/oWTg4HjxONAklBayuKSUeT/hFTxrwnwlAMa8I1qyrP3H95RiQgUiC/RsWM+wZ6jIME0M38wtSM0mmojM4nc6mzr5xKDQgnWb/pmoedT29EU3pTMUS+QVKKerq6kqnI3EVHwmAplO8qBh7WTFnzpz9bOg6FovlfxGEixfOrfT6YxCOQ1rDUaIAG4EJ38+PAwNb/95Bzj8ITAZwLHbMT0yHw3N33YVwEnQDqss41VzPkaalX6Iz+m6Xy/Xp34JAAICR7187nLWuvbe6h9C0DA2uRTTVV9J++87OlpaWJxUVFf9+xj+1cfOWls6OO93Nq1zblMVm9flG3pcvXNPm90+E/777ewB+UIqdqtYXHAAAAABJRU5ErkJggg==",
    //    bucket: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90BCg4hBcbCoOMAAABsSURBVDjLY2RgYFBjYGCIZCAPLGeBam4g0wAGJgYKARMDA8NZCvSfZYQy6sk0oJEFiUNqODRQLQxGDYCAb2To/YZswEsyDHiJbMAHMgz4gO6F5aTkQpgXYElZkoGBgZeEbL2cgYHhMwMDw3MA93ARk+mSg4gAAAAASUVORK5CYII=",
    bucket: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QkQDC8RTstxRAAAAGBJREFUOMtjYBgswIWBgeE/idiFgYGBgRFqwH8GBoYGEi1tYGBgYGRBE9QjUvMlGANmgCsDA8NuElzRANXDwAQV2ENGuO1BNoBsMGoAlQ3wJTIdNEDVYgU+ROQBH6rmQgAWgB19xco60wAAAABJRU5ErkJggg==",
    //    dir: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAAKNJREFUeNrEk7sNwkAQBefQ5m6BTiAAQssZiMh0QFUIMrAEpKYD8ynAJeD4nXQEkJHgu4CXv9GsdteFEEjJgMQ4gPli+aWx227cLwAD8FK8QZ4XTyCL6B6qal+YlzLgCpSn87HpbTCdzAKwAkpg1Bdgn/nbmDLQmby6hC3W5qUGGEcCGpNUJwBq09tgHdO+Pe61eamNvIMLgEkaxuoDuL9/42sAM20/EZafbV8AAAAASUVORK5CYII=",
    dir: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpDNzU0RUNBNzU3OEIxMUUyOEM3QzkxOEZDOTU1RTdFMCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpDNzU0RUNBODU3OEIxMUUyOEM3QzkxOEZDOTU1RTdFMCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkM3NTRFQ0E1NTc4QjExRTI4QzdDOTE4RkM5NTVFN0UwIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkM3NTRFQ0E2NTc4QjExRTI4QzdDOTE4RkM5NTVFN0UwIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+S/WxbAAAAERJREFUeNpi/P//PwMlgJFSA1g2bNiAzYQLQOwIxB8IGcCEQ9wAiPcDsQBBF+CRAxnynlwXEA1GDRg1gCqZiWIDAAIMADidE0PBoGsZAAAAAElFTkSuQmCC",
    r: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90CDRIvNbHTpbwAAADjSURBVDjLpZFBbsIwEEUfVRZYahcVK3qKXoauMFK5C91nkyUB+xC5BqeAA7SKq1B5ugl2EiC04UkjayzN17NnROTRWvvJFbTWL8CBHqbGWOlSlqVkWSbGWAGm3aGHZiMiAByPP6FOd1rP2W7NvhvSCvDe10E+VJPFQpPnm1ZIcsmgPgJVVZGmaejX63y/XL4/AV/JJYPTCeDcN7PZWyuwKAqA8wARqSsGKDVGqXGjV8H07AnRQPq21TK8+YSBAQMN4hb6Df7wB/5eA+4zmEyehxk451itPrhFksSxUeP+lf+z+wXwdayJk/mqtgAAAABJRU5ErkJggg==",
    box: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wMHAwRAVvTmTAAAAK/SURBVDjLpZM9bFxFGEXPNzPvZ+39sb2xHceREjDQBwlDCqqIiiotokAghYKEjvSkQkKJkEiB0lOkoAHaBAokFCQKUATIIOLIMbHWrHfX+7zvvZk3MzQODUgU3PJK5+g2F/5n5N/Kb66/1NNK3hAxr4HcFqVuvfju18V/Cu58sPmMVnJZ4K32Qr+t8za+KnCz4kCUuiGibm5euTv5h+CL958/nxj1XivVF+e6C9TVhPmFdbROgEhwNU1d4m09UaJuInLjhct3DgDUh5ee7j14PLxulLvYP/0seadPkub88Wib0eB3bDkmxgbRoFPpxeCuKvjsyQIzOyqImT7/y8Mh++NveW7jLFmrx6m1NlWxz6PHA7otQ7tloAmYJE9isOeeCJRtIrULLLUTjsqG7+//xs72z7jZgCTNONlVJKEiuobW0jqSaoiet19dFQATJcc2FSFEciNoLYwOHcPDASvdjM5cQntxlbR9gqacoFSK84VsnOrkH11Zdmp0FFXjobSeCFgXSDS0Eo11ge7yGXSaU092UUlCaEpC8FK4tDcu4rzZ2a/S+bWI94HSAgFigDQD24Cvp4gIOp0juBJvC2L07B1Uc/Mtg9k7sHMbywZrA3lLECV4AtaCpAp79CcmzXHlhOBrAJrGyNbOVBY7qTO1C9r5EKyPSttAiJEs01SuQStFkrdp6gKd5AzHjixVxCDxp+1paZRUxoc4Kp36bndYbS53U5WlCq0CMYIPMY7GI0mNpiqmGK0oK4jIveGkPgRqfTBt3A8Pqtvrq52HtglnGh9XIaKUkCQ6nj6RyWBsmdXCtFI/bu2Fq5c+3roGzIAgWokCDNACOhfOLb781Ip+vd+RC2dXWibROkxKvvp1z376yZe7d4HpMdz8/YVjiQYyoA30Ti6la2++0n/n83vTW/e3ix1gcgzXgPchBoC/AFu/UBF5InryAAAAAElFTkSuQmCC",
    bluebox: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wMHAwTE5pcivoAAALsSURBVDjLXZPPaxxlGMc/77wz+3N2k822tWsTIrQFe/BWEKxKCV5UohdFhJ60p6rgUfpP6C0K4kHx0ENEkV7aElHwUikhFVosRGoTm83+3pnZnXfed2beHtItIQ98+Z6+H57nga8AsNYKDkYcEofcHvKZEEJYcSTszPzqL3fmf3+w/+a51tytby9d6D0N5UecGeBZ8MPv/jh9fy/6dKzMpVPHmvWdbl/XCvKn5Wbl6+ufrNwGssMgYa2VgFj58sZr7VB/LqX3zlKrydJzTTzXxdqcx90hO+0Bk2l8Z74i1z6+cOba5VfOqGeAb3579M/NR53T40xwrDGHFALPEUjn4LoMi0ktwWTKXqCIqAVrbyycvHj2hHYBR+bO8Q/Ov0imEzZ2xrRDRalQwC9LLBalUgaJQy+tU6gvIBJbv3j2RA4IFxDdICFa9ulMCrz/UgOs5kEwpeh57I4Nt/dzsmLOYlEThgFjUePp33IHoD9SJAbuTVyudRweixJvnVtg3/i00wpLPiwQ0hkO6YYKawWj0UjONqAfKHwDkxTqqeW/RHA3hO2+Zqk05e5wTD9KmOqMKDEUqoLNzU0PyF2AQaBoaIhiw0h6TIwgUDCODb5NiWJNlKREyhAozXwOW1tbFSmlcAHbD2KaytCdGgyWglfEs4LeNKeaa4axYRgpwlgTTTXVDDqdTslaewAYh4kNlKUbZsTGonOwCYwm1vq5Ft1AMYgU08SQR5o0gziOcRxHuoCNtdl6uPHX6/Vmi3Yyh9I5IoEgMdkgT9x+qJhEGrdQo77cJMuy+4DJskwLa60DOCtf3HhZpfZKtVx+L3x+sfCv8CFxTINd72HfodQ4aQp5fP24/v/Hd4Nf/5RSJmma6lkXZn1wPvvq5qndsbhS9esf/Zy/UEtzxnURfn8+/fuHV7m353mecV1XSym1lDI72kaxvr5e3N7eruyP0tpG/e3LK/rW2mLNUb7vm3K5nFarVdNqtbJer2dXV1fzJ6cDpboAZRAGAAAAAElFTkSuQmCC",
    refresh: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAK8AAACvABQqw0mAAAAAd0SU1FB90CFA8bKScXIjIAAAJ1SURBVDjLlVJdSJNRGH7es+/7NlduWFLTKAskwjJqZYiBglJhLKguqou6EFkFIkLQH9IPBFI3BsouzMJupGYRajcqmeBFhWBU5oUgpZikrSnzZ9v3nW/ndKEbziXUAwfOOe/7Puc9z/MCq1DwMmB1NX/rzfCNnsc/gK08lPgnnT8Cs33BULg0HI4YKdkHX9DqKwKArXXv1bTMTFcoyruC89E8MxaDw659t6rKhIUwRBLdP2t2v/5bBwQA+5pH8ibnIj3BucgWIQRASw8RERTGYFUtsGmWYUXKmqmr7t4UAnal54GQ8lq8MBlyOU0CEnA67MiwqfvHbhZ+Smgg6o9eV2L8Nhk6wI2lZeggrpvE+TTjxgxxQ4IbmJsJYSa00JQiotnguacJ8zIZOmDosAnzTpowt8tGj0s0ejZqprnDKmPHSNebjHDkUPatt4cTTbZ+LsmO79XK52dZxTNp9/ovAEDnaM62lo8HHrd9SVfiOelVryrSq9vrEx0s8sW2tuEzDgDgT875bcIsjy6owwAwHhjnYT5bGTL29PiHyuwAMO873aL/Ct5PiPjwXe5vq7KJW2hdJxENMFInGCkhIblLj80WRoyxGxZmh1XJGlSIlV8s6A8kuVDXn+MF6JHC7GBkBSNlOSRgiihMsQhAgJGGNNU1atc2HPG6O8YSBABwt2/nGyFlGSCSB4UIBMuyoQKMFNiUjIApRH5t8YfpFOOrO/JrhZBVUiJLxq2ipIkY8Z36uivpC6txqb3YbhqhIingFlLmxmLSKyXAGAaYqh13aFjfcHJwfE2ClSitK9psc85PMVC3M999orX4Kcf/wuPb27VW7A+O2QVVA1M1CQAAAABJRU5ErkJggg==",
    newitem: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAAtxJREFUeNqM0llIVHEUBvDv3vlfZ8ac6zZtWpmamtliUUHRDlFJWlEYLdBLtG/QBlFJQUTSU089RZRlG4EvkS9NlqkpldHyYLk1OurcOzp30vHO/y6nBwsSIvzgvBw+fpyHA8MwwDmHbdsjQwSbCACkYDBYp6pqU3Fxcfyf/Z+eYRjQOQf+Bnw+30IiIsMwhizL4n3lV6mn7BzZtm1yzn8SETU0NKz+J2ARobe3t85/+SI1506j9hOHqTEO9FYEtR/ZTx/n5FDH6eOkquoni2g00NjUtEzTtBYioneLCulVHKg2yUkNmelUn5VOtUlueu0SqDE/m4iIIpFI64fm5vU65xAMIlicR9rOn/UEKytgmQbYuARAEDAqRLCiQxBFhtTNWzDzxk1LcjgkFhuKIhLR2qJKcN5Al/q7reF/cXUHoA0MtA9Gh4klJIxz6ro+PZiVC0uOw1jimJEDWZbTDhw8lCi0+/3PtUeV696ePIPUnIwxAf3fOjG/7AK8e/e9ZH2K0uWdPRdivANm3NguED1OJBYWQunvDwgAXIqifO54+CC7/tSxMQELL11B/r6D3cnJybniQDis25Ikfn1wD2GdQLIMISkF5JFhudwgjwySkyCkpILkRER0wpf7d2FJkqSoapQRRPCYjoLDR+EY70VXbS2YxCC4nAARbAAQBJBlwTIMZJRsQN7W7eA6t9O8XkE0jRhWLV2y+Gdm9q0dT6rMhLw8dPn7EAoEMBSLIcpjCPUEEPD3gU1Kw+6qZ6TPKrizq3TbAjUUIkFRVYAIkkfG99bWp4P1b7Z0vq5BXtFGPN6zE6Zuo7SiAh01PkycV4jJRRt96VOmrOHhMESHiBEAgMkNlGwqmXC78mG1DXtQdruTgx/eF5g6x9Tly1pCmtYjMSnxatnFTeXXyn8wxiCMAgxz5EmcTjCXCynxblf1C9910eFwrl254nh/dDhqcQ5zeBgAwBiDIAr4NQAWJarVjshqqgAAAABJRU5ErkJggg==",
};
class UtilsNew {

    static get MESSAGE_SUCCESS() {
        return "SUCCESS";
    }

    static get MESSAGE_ERROR() {
        return "ERROR";
    }

    static get MESSAGE_INFO() {
        return "INFO";
    }

    static get MESSAGE_WARNING() {
        return "WARNING";
    }

    static isUndefined(obj) {
        return typeof obj === 'undefined';
    }

    static isNotUndefined(obj) {
        return typeof obj !== 'undefined';
    }

    static isNull(obj) {
        return obj === null;
    }

    static isNotNull(obj) {
        return obj !== null;
    }

    static isUndefinedOrNull(obj) {
        return typeof obj === 'undefined' || obj === null;
    }

    static isNotUndefinedOrNull(obj) {
        return typeof obj !== 'undefined' && obj !== null;
    }

    static isEmpty(str) {
        return typeof str === 'undefined' || str === null || str === '';
    }

    static isNotEmpty(str) {
        return typeof str !== 'undefined' && str !== null && str !== '';
    }

    static isEmptyArray(arr) {
        return typeof arr !== 'undefined' && arr !== null && arr.length === 0;
    }

    static isNotEmptyArray(arr) {
        return typeof arr !== 'undefined' && arr !== null && arr.length > 0;
    }

    static containsArray(arr, item) {
        if (UtilsNew.isNotEmptyArray(arr) && UtilsNew.isNotUndefinedOrNull(item)) {
            return arr.indexOf(item) > -1;
        }

        return false;
    }

    static removeDuplicates (array, prop) {
        var newArray = [];
        var lookupObject  = {};

        for(let i in array) {
            lookupObject[array[i][prop]] = array[i];
        }

        for(let i in lookupObject) {
            newArray.push(lookupObject[i]);
        }
        return newArray;
    }

    static checkPermissions(project) {
        return Object.keys(project).length === 0;
    }

    static isNotEqual(str, str2) {
        return str !== str2;
    }

    static isEqual(str, str2) {
        return str === str2;
    }
}
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

BamCache.prototype.putHistogramFeaturesByRegion = FileFeatureCache.prototype.putFeaturesByRegion;

function BamCache(args) {
	this.args = args;
	this.id = Math.round(Math.random() * 10000000); // internal id for this class

	this.chunkSize = 50000;
	this.gzip = true;
	this.maxSize = 10*1024*1024;
	this.size = 0;
	
	if (args != null){
		if(args.chunkSize != null){
			this.chunkSize = args.chunkSize;
		}
		if(args.gzip != null){
			this.gzip = args.gzip;
		}
	}
	
	this.cache = {};

	//deprecated trackSvg has this object now
	//this.chunksDisplayed = {};
	
	this.maxFeaturesInterval = 0;//for local histogram
	
	//XXX
	this.gzip = false;
};

BamCache.prototype._getChunk = function(position){
	return Math.floor(position/this.chunkSize);
};

//new 
BamCache.prototype.getFeatureChunk = function(key){
	if(this.cache[key] != null) {
		return this.cache[key];
	}
	return null;
};
//new
BamCache.prototype.getFeatureChunksByRegion = function(region){
	var firstRegionChunk, lastRegionChunk,  chunks = [], key;
	firstRegionChunk = this._getChunk(region.start);
	lastRegionChunk = this._getChunk(region.end);
	for(var i=firstRegionChunk; i<=lastRegionChunk; i++){
		key = region.chromosome+":"+i;
		// check if this key exists in cache (features from files)
		if(this.cache[key] != null ){
			chunks.push(this.cache[key]);
		}
		
	}
	//if(chunks.length == 0){
		//return null;
	//}
	return chunks;
};



BamCache.prototype.putFeaturesByRegion = function(resultObj, region, featureType, dataType){
	var key, firstChunk, lastChunk, firstRegionChunk, lastRegionChunk, read, gzipRead;
	var reads = resultObj.reads;
	var coverage = resultObj.coverage;
	
	//initialize region
	firstRegionChunk = this._getChunk(region.start);
	lastRegionChunk = this._getChunk(region.end);
	
	var chunkIndex = 0;
	console.time("BamCache.prototype.putFeaturesByRegion1")
	//TODO the region for now is a chunk region, so this for is always 1 loop
	for(var i=firstRegionChunk, c=0; i<=lastRegionChunk; i++, c++){
		key = region.chromosome+":"+i;
		if(this.cache[key]==null || this.cache[key][dataType] == null){
			this.cache[key] = {};
			this.cache[key][dataType] = [];
			this.cache[key].key = key;
			this.cache[key].start = parseInt(region.start)+(c*this.chunkSize);
			this.cache[key].end = parseInt(region.start)+((c+1)*this.chunkSize)-1;
		}
        if(dataType === 'data'){
            //divide the coverage array in multiple arrays of chunksize length
    //		var chunkCoverage = coverage.slice(chunkIndex,chunkIndex+this.chunkSize);
            var chunkCoverageAll = coverage.all.slice(chunkIndex,chunkIndex+this.chunkSize);
            var chunkCoverageA = coverage.a.slice(chunkIndex,chunkIndex+this.chunkSize);
            var chunkCoverageC = coverage.c.slice(chunkIndex,chunkIndex+this.chunkSize);
            var chunkCoverageG = coverage.g.slice(chunkIndex,chunkIndex+this.chunkSize);
            var chunkCoverageT = coverage.t.slice(chunkIndex,chunkIndex+this.chunkSize);
            var chunkCoverage = {
                "all":chunkCoverageAll,
                "a":chunkCoverageA,
                "c":chunkCoverageC,
                "g":chunkCoverageG,
                "t":chunkCoverageT
            };
        }

		if(this.gzip) {
			this.cache[key]["coverage"]=RawDeflate.deflate(JSON.stringify(chunkCoverage));
		}else{
			this.cache[key]["coverage"]=chunkCoverage;
		}
		chunkIndex+=this.chunkSize;
	}
	console.timeEnd("BamCache.prototype.putFeaturesByRegion1")
	console.time("BamCache.prototype.putFeaturesByRegion")
	var ssss = 0;


    if(dataType === 'data'){
        for(var index = 0, len = reads.length; index<len; index++) {
            read = reads[index];
            read.featureType = 'bam';
            firstChunk = this._getChunk(read.start);
            lastChunk = this._getChunk(read.end == 0?read.end=-1:read.end);//0 is not a position, i set to -1 to avoid enter in for
    //		Some reads has end = 0. So will not be drawn IGV does not draw those reads

            if(this.gzip) {
                gzipRead = RawDeflate.deflate(JSON.stringify(read));
                //ssss+= gzipRead.length;
            }else{
                gzipRead = read;
                //ssss+= JSON.stringify(gzipRead).length;
            }

            for(var i=firstChunk, c=0; i<=lastChunk; i++, c++) {
                if(i >= firstRegionChunk && i<= lastRegionChunk){//only if is inside the called region
                    key = read.chromosome+":"+i;
//                    if(this.cache[key].start==null){
//                        this.cache[key].start = parseInt(region.start)+(c*this.chunkSize);
//                    }
//                    if(this.cache[key].end==null){
//                        this.cache[key].end = parseInt(region.start)+((c+1)*this.chunkSize)-1;
//                    }
//                    if(this.cache[key][dataType] != null){
//                        this.cache[key][dataType] = [];
                        this.cache[key][dataType].push(gzipRead);
//                    }

                }
            }
        }
    }


	console.timeEnd("BamCache.prototype.putFeaturesByRegion");
	console.log("BamCache.prototype.putFeaturesByRegion"+ssss)
};

BamCache.prototype.clear = function(){
	this.size = 0;		
	this.cache = {};
	console.log("bamCache cleared")
};

/*
BamCache.prototype.getFeaturesByChunk = function(key, dataType){
	var features =  [];
	var feature, firstChunk, lastChunk, chunk;
	var chr = key.split(":")[0], chunkId = key.split(":")[1];
	var region = {chromosome:chr,start:chunkId*this.chunkSize,end:chunkId*this.chunkSize+this.chunkSize-1};
	
	if(this.cache[key] != null && this.cache[key][dataType] != null) {
		if(this.gzip) {
			coverage = JSON.parse(RawDeflate.inflate(this.cache[key]["coverage"]));
		}else{
			coverage = this.cache[key]["coverage"];
		}
		
		for ( var i = 0, len = this.cache[key]["data"].length; i < len; i++) {
			if(this.gzip) {
				feature = JSON.parse(RawDeflate.inflate(this.cache[key]["data"][i]));
			}else{
				feature = this.cache[key]["data"][i];
			}
			
			//check if any feature chunk has been already displayed 
			var displayed = false;
			firstChunk = this._getChunk(feature.start);
			lastChunk = this._getChunk(feature.end);
			for(var f=firstChunk; f<=lastChunk; f++){
				var fkey = feature.chromosome+":"+f;
				if(this.chunksDisplayed[fkey+dataType]==true){
					displayed = true;
					break;
				}
			}
			
			if(!displayed){
				features.push(feature);
				returnNull = false;
			}
		}
		this.chunksDisplayed[key+dataType]=true;
		chunk = {reads:features,coverage:coverage,region:region};
		return chunk;
	}
	
};

BamCache.prototype.getFeaturesByRegion = function(region, dataType){
	var firstRegionChunk, lastRegionChunk, firstChunk, lastChunk, chunks = [], feature, key, coverage, features = [], displayed;
	firstRegionChunk = this._getChunk(region.start);
	lastRegionChunk = this._getChunk(region.end);
	for(var i=firstRegionChunk; i<=lastRegionChunk; i++){
		key = region.chromosome+":"+i;
		if(this.cache[key] != null){
			if(this.gzip) {
				coverage = JSON.parse(RawDeflate.inflate(this.cache[key]["coverage"]));
			}else{
				coverage = this.cache[key]["coverage"];
			}

			for ( var j = 0, len = this.cache[key]["data"].length; j < len; j++) {
				if(this.gzip) {
					feature = JSON.parse(RawDeflate.inflate(this.cache[key]["data"][j]));
				}else{
					feature = this.cache[key]["data"][j];
				}
				
				
//				check if any feature chunk has been already displayed 
				displayed = false;
				firstChunk = this._getChunk(feature.start);
				lastChunk = this._getChunk(feature.end);
				for(var f=firstChunk; f<=lastChunk; f++){
					var fkey = region.chromosome+":"+f;
					if(this.chunksDisplayed[fkey+dataType]==true){
						displayed = true;
						break;
					}
				}
				
				if(!displayed){
					features.push(feature);
				}
				
			}
		}
		this.chunksDisplayed[key+dataType]=true;//mark chunk as displayed
		chunks.push({reads:features,coverage:coverage,region:region});
	}
	return chunks;
};
*/



//BamCache.prototype.remove = function(region){
//	var firstChunk = this._getChunk(region.start);
//	var lastChunk = this._getChunk(region.end);
//	for(var i=firstChunk; i<=lastChunk; i++){
//		var key = region.chromosome+":"+i;
//		this.cache[key] = null;
//	}
//};
//

//
//BamCache.prototype.clearType = function(dataType){
//	this.cache[dataType] = null;
//};
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

function FeatureCache(args) {

    // Using Underscore 'extend' function to extend and add Backbone Events
    _.extend(this, Backbone.Events);

//    this.args = args;

    // Default values
    this.id = Utils.genId("FeatureCache");
    // Accepted values are 'memory' and 'indexeddb' [memory]
    this.storeType = 'memory';
    this.chunkSize = 50000;
    this.maxSize = 10*1024*1024;
    this.size = 0;
    this.verbose = false;
    this.gzip = true;

    // Now we set the args parameters
    // must be the last instruction
    _.extend(this, args);



    this.store;

//    this.cache = {};
    this.chunksDisplayed = {};

    this.maxFeaturesInterval = 0;

    this.init();
};

FeatureCache.prototype = {

    init: function() {
        this.size = 0;
        if(typeof this.storeType === 'undefined' || this.storeType == 'memory') {
            this.store = new MemoryStore({});
        }else {
            this.store = new IndexedDBStore({});
        }
//        this.cache = {};
    },

    _getChunk: function(position){
        return Math.floor(position/this.chunkSize);
    },

    _getChunkKey: function(chromosome, chunkId){
        return chromosome + ":" + chunkId;
    },

    getChunkRegion: function(region){
        start = this._getChunk(region.start) * this.chunkSize;
        end = (this._getChunk(region.end) * this.chunkSize) + this.chunkSize-1;
        return {start: start, end: end};
    },

    getFirstFeature: function(){
       return this.store.get(Object.keys(this.store.store)[0].key)[0];
    },


//new
    getFeatureChunk: function(key){
        return this.store.get(key);
    },
//new
    getFeatureChunksByRegion: function(region){
        var firstRegionChunk, lastRegionChunk;
        var chunks = [];
        var key;
        firstRegionChunk = this._getChunk(region.start);
        lastRegionChunk = this._getChunk(region.end);
        for(var i=firstRegionChunk; i<=lastRegionChunk; i++){
            key = region.chromosome+":"+i;

            // check if this key exists in cache (features from files)
            var feature = this.store.get(key);
            if(!_.isUndefined(feature)){
                chunks.push(feature);
            }
        }
        // Returns empty list if nothing was found
        return chunks;
    },


    putFeatureByRegion:function(feature, region){

        var firstFeatureChunk = this._getChunk(feature.start);
        var lastFeatureChunk = this._getChunk(feature.end);

        var firstRegionChunk = this._getChunk(region.start);
        var lastRegionChunk = this._getChunk(region.end);

        for(var i=firstFeatureChunk; i<=lastFeatureChunk; i++) {
            if(i >= firstRegionChunk && i<= lastRegionChunk){//only if is inside the called region
                key = region.chromosome+":"+i;
                this.store.put()
                this.cache[key][dataType].push(gzipFeature);
            }
        }
    },

    putFeaturesByRegion: function(featureDataList, region){
        var key, firstRegionChunk, lastRegionChunk, firstChunk, lastChunk, feature, gzipFeature;

        //initialize region
        firstRegionChunk = this._getChunk(region.start);
        lastRegionChunk = this._getChunk(region.end);

        for(var i=firstRegionChunk; i<=lastRegionChunk; i++){
            key = region.chromosome+":"+i;
            if(this.cache[key]==null){
                this.cache[key] = {};
                this.cache[key].key = key;
            }
//        else{
//            // TODO
//            console.log(region.chromosome+region.start+region.end+'-'+featureType+'-'+dataType);
////            return;
//        }

//            this.store.add(key+"_"+dataType, value);
//            this.store.add(key, {datatype: value});


            if(this.cache[key][dataType]==null){
                this.cache[key][dataType] = [];
            }
        }

        //Check if is a single object
        if(featureDataList.constructor != Array){
            featureDataList = [featureDataList];
        }

        //loop over features and set on corresponding chunks
        for(var index = 0, len = featureDataList.length; index<len; index++) {
            feature = featureDataList[index];
            feature.featureType = featureType;
            firstChunk = this._getChunk(feature.start);
            lastChunk = this._getChunk(feature.end);

            if(this.gzip) {
                gzipFeature = RawDeflate.deflate(JSON.stringify(feature));
            }else{
                gzipFeature = feature;
            }

            for(var i=firstChunk; i<=lastChunk; i++) {
                if(i >= firstRegionChunk && i<= lastRegionChunk){//only if is inside the called region
                    key = region.chromosome+":"+i;
                    this.cache[key][dataType].push(gzipFeature);
                }
            }
        }
//        console.log(this.cache[region.chromosome+":"+firstRegionChunk][dataType].length)
    },


//used by BED, GFF, VCF
    putFeatures: function(featureDataList, dataType){
        var feature, key, firstChunk, lastChunk;

        //Check if is a single object
        if(featureDataList.constructor != Array){
            featureDataList = [featureDataList];
        }

        for(var index = 0, len = featureDataList.length; index<len; index++) {
            feature = featureDataList[index];
            firstChunk = this._getChunk(feature.start);
            lastChunk = this._getChunk(feature.end);
            for(var i=firstChunk; i<=lastChunk; i++) {
                key = feature.chromosome+":"+i;
                if(this.cache[key]==null){
                    this.cache[key] = [];
                    this.cache[key].key = key;
                }
                if(this.cache[key][dataType]==null){
                    this.cache[key][dataType] = [];
                }
                if(this.gzip) {
                    this.cache[key][dataType].push(RawDeflate.deflate(JSON.stringify(feature)));
                }else{
                    this.cache[key][dataType].push(feature);
                }

            }
        }
    },

    putChunk: function(key, item){
        this.cache[key] = item;
    },

    getChunk: function(key){
        return this.cache[key];
    },

    putCustom: function(f){
        f(this);
    },

    getCustom: function(f){
        f(this);
    },



    remove: function(region){
        var firstChunk = this._getChunk(region.start);
        var lastChunk = this._getChunk(region.end);
        for(var i=firstChunk; i<=lastChunk; i++){
            var key = region.chromosome+":"+i;
            this.cache[key] = null;
        }
    },

    clear: function(){
        this.size = 0;
        this.cache = {};
    }
}



//END



//THOSE METHODS ARE NOT USED



/*
 FeatureCache.prototype.getFeaturesByChunk = function(key, dataType){
 var features =  [];
 var feature, firstChunk, lastChunk;

 if(this.cache[key] != null && this.cache[key][dataType] != null) {
 for ( var i = 0, len = this.cache[key][dataType].length; i < len; i++) {
 if(this.gzip) {
 feature = JSON.parse(RawDeflate.inflate(this.cache[key][dataType][i]));
 }else{
 feature = this.cache[key][dataType][i];
 }

 //check if any feature chunk has been already displayed
 var displayed = false;
 firstChunk = this._getChunk(feature.start);
 lastChunk = this._getChunk(feature.end);
 for(var f=firstChunk; f<=lastChunk; f++){
 var fkey = feature.chromosome+":"+f;
 if(this.chunksDisplayed[fkey+dataType]==true){
 displayed = true;
 break;
 }
 }

 if(!displayed){
 features.push(feature);
 returnNull = false;
 }
 }
 this.chunksDisplayed[key+dataType]=true;
 return features;
 }

 return null;
 };


 FeatureCache.prototype.getFeaturesByRegion = function(region, dataType){
 var firstRegionChunk, lastRegionChunk, firstChunk, lastChunk, features = [], feature, key, returnNull = true, displayed;
 firstRegionChunk = this._getChunk(region.start);
 lastRegionChunk = this._getChunk(region.end);
 for(var i=firstRegionChunk; i<=lastRegionChunk; i++){
 key = region.chromosome+":"+i;
 //check if this key exists in cache (features from files)
 if(this.cache[key] != null && this.cache[key][dataType] != null){
 for ( var j = 0, len = this.cache[key][dataType].length; j < len; j++) {
 if(this.gzip) {
 try {
 feature = JSON.parse(RawDeflate.inflate(this.cache[key][dataType][j]));
 } catch (e) {
 //feature es ""
 console.log(e)
 debugger

 }

 }else{
 feature = this.cache[key][dataType][j];
 }
 // we only get those features in the region AND check if chunk has been already displayed
 if(feature.end > region.start && feature.start < region.end){

 //		 check displayCheck argument
 if(region.displayedCheck != false){
 //		check if any feature chunk has been already displayed
 displayed = false;
 firstChunk = this._getChunk(feature.start);
 lastChunk = this._getChunk(feature.end);
 for(var f=firstChunk; f<=lastChunk; f++){
 var fkey = region.chromosome+":"+f;
 if(this.chunksDisplayed[fkey+dataType]==true){
 displayed = true;
 break;
 }
 }

 if(!displayed){
 features.push(feature);
 returnNull = false;
 }
 }else{
 features.push(feature);
 returnNull = false;
 }


 }
 }
 }
 //check displayCheck argument
 if(region.displayedCheck != false){
 this.chunksDisplayed[key+dataType]=true;//mark chunk as displayed
 }
 }
 if(returnNull){
 return null;
 }else{
 return features;
 }
 };
 */




/*

 FeatureCache.prototype.putChunk = function(featureDataList, chunkRegion, dataType){
 var feature, key, chunk;
 chunk = this._getChunk(chunkRegion.start);
 key = chunkRegion.chromosome+":"+chunk;

 if(this.cache[key]==null){
 this.cache[key] = [];
 }
 if(this.cache[key][dataType]==null){
 this.cache[key][dataType] = [];
 }

 if(featureDataList.constructor == Object){
 if(this.gzip) {
 this.cache[key][dataType].push(RawDeflate.deflate(JSON.stringify(featureDataList)));
 }else{
 this.cache[key][dataType].push(featureDataList);
 }
 }else{
 for(var index = 0, len = featureDataList.length; index<len; index++) {
 feature = featureDataList[index];
 if(this.gzip) {
 this.cache[key][dataType].push(RawDeflate.deflate(JSON.stringify(feature)));
 }else{
 this.cache[key][dataType].push(feature);
 }
 }
 }

 };

 */


//NOT USED dev not tested
//FeatureCache.prototype.histogram = function(region, interval){
//
//var intervals = (region.end-region.start+1)/interval;
//var intervalList = [];
//
//for ( var i = 0; i < intervals; i++) {
//var featuresInterval = 0;
//
//var intervalStart = i*interval;//deberia empezar en 1...
//var intervalEnd = ((i+1)*interval)-1;
//
//var firstChunk = this._getChunk(intervalStart+region.start);
//var lastChunk = this._getChunk(intervalEnd+region.start);
//
//console.log(this.cache);
//for(var j=firstChunk; j<=lastChunk; j++){
//var key = region.chromosome+":"+j;
//console.log(key);
//console.log(this.cache[key]);
//for ( var k = 0, len = this.cache[key].length; k < len; k++) {
//if(this.gzip) {
//feature = JSON.parse(RawDeflate.inflate(this.cache[key][k]));
//}else{
//feature = this.cache[key][k];
//}
//if(feature.start > intervalStart && feature.start < intervalEnd);
//featuresInterval++;
//}
//
//}
//intervalList[i]=featuresInterval;
//
//if(this.maxFeaturesInterval<featuresInterval){
//this.maxFeaturesInterval = featuresInterval;
//}
//}
//
//for ( var inter in  intervalList) {
//intervalList[inter]=intervalList[inter]/this.maxFeaturesInterval;
//}
//};
/**
 * Created with IntelliJ IDEA.
 * User: fsalavert
 * Date: 10/18/13
 * Time: 12:06 PM
 * To change this template use File | Settings | File Templates.
 */

function FeatureChunkCache(args) {
    _.extend(this, Backbone.Events);

    // Default values
    this.id = Utils.genId("FeatureChunkCache");

    this.defaultChunkSize = 50000;
    this.defaultCategory = "defaultCategory";
    this.limit;

    _.extend(this, args);

    if (this.storeType == "MemoryStore") {
        this.store = new MemoryStore({});
    } else {
        this.store = new IndexedDBStore({cacheId: this.cacheId});
    }

    this.verbose = false;
}


FeatureChunkCache.prototype = {
    /**
     *
     * @param region an object Region
     * @param categories approximately the table in the DB. May be an array
     * @param dataType another level of classification
     * @param chunkSize
     * @param callback receives two arguments: (cachedChunks, uncachedRegions) with this structure:
     * cachedChunks: {
     *     categories[0]: [chunk, chunk, chunk],
     *     categories[1]: [chunk, chunk, chunk],
     *     ...
     * }
     * uncachedRegions: {
     *     categories[0]: [region, region],
     *     categories[1]: [region, region],
     *     ...
     * }
     */
    get: function (region, categories, dataType, chunkSize, callback) {
        var _this = this;
        var temporalChunkSize = chunkSize ? chunkSize : this.defaultChunkSize;

        var firstChunkId = this.getChunkId(region.start, temporalChunkSize);
        var lastChunkId = this.getChunkId(region.end, temporalChunkSize);
        var keys = [];
        var chunksAndRegions = {cachedChunks: {}, uncachedRegions: {}};

        for (var chunkId = firstChunkId; chunkId <= lastChunkId; chunkId++) {
            keys.push(this.getChunkKey(region.chromosome, chunkId, dataType, temporalChunkSize));
        }

        if (!_.isArray(categories)) {
            categories = [categories];
        }
        var callbackCount = 0;
        for (var cat = 0; cat < categories.length; cat++) {
            callbackCount++;
            chunksAndRegions.cachedChunks[categories[cat]] = [];
            chunksAndRegions.uncachedRegions[categories[cat]] = [];
            this.getChunks(categories[cat], keys, function (iterCat) {
                return function (chunks) {
                    for (var i = 0; i < chunks.length; i++) {
                        var chunkRegionEnd = parseInt(((firstChunkId + i) * temporalChunkSize) + temporalChunkSize - 1);
                        var chunkRegionStart = parseInt((firstChunkId + i) * temporalChunkSize);
                        var chunkRegion = new Region({
                            chromosome: region.chromosome,
                            start: chunkRegionStart,
                            end: chunkRegionEnd
                        });

                        if (_.isUndefined(chunks[i])) {
                            chunksAndRegions.uncachedRegions[categories[iterCat]].push(chunkRegion);
                        } else {
                            chunksAndRegions.cachedChunks[categories[iterCat]].push(chunks[i]);
                        }
                    }
                    if (this.verbose) {
                        console.log(chunksAndRegions);
                    }
                    callbackCount--;
                    if (callbackCount == 0 && callback) {
                        callback(chunksAndRegions.cachedChunks, chunksAndRegions.uncachedRegions);
                    }
                }
            }(cat));     // to force the closure to have each value of cat, and not just the last one
        }
    },

    /*
     getChunk: function (chunkId) {
     return this.store.get(chunkId);
     },*/

    getChunk: function (category, chunkKey, callback) {
        if (!callback) {
            console.log("bad FeatureChunkCache usage: undefined callback");
        }
        if (!category) {
            category = this.defaultCategory;
        }
        this.store.get(category, chunkKey, callback);
    },

    getChunks: function (category, chunkKeysArray, callback) {
        if (!callback) {
            console.log("bad FeatureChunkCache usage: undefined callback");
        }
        if (!category) {
            category = this.defaultCategory;
        }
        this.store.getAll(category, chunkKeysArray, callback);
    },

    joinRegions: function (regions) {
        if (regions.length <= 1) {
            return regions;
        }
        // assert(regions.length >= 2)

        var joinedRegions = [];
        var regionStart = regions[0].start;
        var regionEnd = region[0].end;
        var regionChromosome = regions[0].chromosome;

        for (var i = 1; i < regions.length; i++) {
            if (regions[i].chromosome == regionChromosome && regions[i].start - 1 <= regionEnd) { // CAUTION: assuming inclusive intervals
                if (regions[i].end > regionEnd) {
                    regionEnd = regions[i].end;
                }
            } else {
                joinedRegions.push(new Region({chromosome: regionChromosome, start: regionStart, end: regionEnd}));
                regionChromosome = regions[i].chromosome;
                regionStart = regions[i].start;
                regionEnd = regions[i].end;
            }
        }

        joinedRegions.push(new Region({chromosome: regionChromosome, start: regionStart, end: regionEnd}));

        return joinedRegions;
    },

    /**
     * TODO: the regions must be equally long to the chunksize
     */
    putByRegions: function (regionArray, valueArray, category, dataType, chunkSize) { // encoded
        var temporalChunkSize = chunkSize ? chunkSize : this.defaultChunkSize;
        var chunkKeyArray = [];
        for (var i = 0; i < regionArray.length; i++) {
            var chunkId = this.getChunkId(regionArray[i].start, temporalChunkSize);
            var chunkKey = this.getChunkKey(regionArray[i].chromosome, chunkId, dataType, chunkSize);
            chunkKeyArray.push(chunkKey);
        }
        return this.putChunks(chunkKeyArray, regionArray, valueArray, category, false);
    },

    /** several chunks in one transaction. this is a fast put */
    putChunks: function (chunkKeyArray, regionArray, valueArray, category, encoded) {
        var valueStoredArray = [];
        for (var i = 0; i < valueArray.length; i++) {
            valueStoredArray.push(this.createEntryValue(chunkKeyArray[i], regionArray[i], valueArray[i], encoded));   // TODO add timestamp, last usage time, size, etc.
        }
        if (!category) {
            category = this.defaultCategory;
        }
        this.store.putAll(category, chunkKeyArray, valueStoredArray);
        return valueStoredArray;
    },

    createEntryValue: function (chunkKey, region, value, encoded) {
        var valueStored;
        if (encoded) {
            valueStored = {value: value, chunkKey: chunkKey, region: region, enc: encoded}; // TODO add timestamp, last usage time, size, etc.
        } else {
            valueStored = {value: value, chunkKey: chunkKey, region: region}; // TODO add timestamp, last usage time, size, etc.
        }
        return valueStored;
    },

    getChunkKey: function (chromosome, chunkId, dataType, chunkSize) {
        var keySuffix = dataType ? "_" + dataType : "";
        keySuffix += "_" + chunkSize;       // e.g. "_hist_1000"
        return chromosome + ":" + chunkId + keySuffix;
    },

    getChunkId: function (position, chunkSize) {
        return Math.floor(position / chunkSize);
    },


    getDefaultChunkSize: function () {
        return this.defaultChunkSize;
    },

    delete:function(){
        this.store.destroyDB();
    }

    /* TODO:
     visit: function (chunkKey) {
     var _this = this;
     this.getChunk(chunkKey, function(value){
     //            value.lastUsed = ...
     _this.putChunk(chunkKey, value);
     });
     },*/
};
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

function FileFeatureCache(args) {
	this.args = args;
	this.id = Math.round(Math.random() * 10000000); // internal id for this class

	this.chunkSize = 50000;
	this.gzip = true;
	this.maxSize = 10*1024*1024;
	this.size = 0;
	
	if (args != null){
		if(args.chunkSize != null){
			this.chunkSize = args.chunkSize;
		}
		if(args.gzip != null){
			this.gzip = args.gzip;
		}
	}
	
	this.cache = {};
	this.chunksDisplayed = {};
	
	this.maxFeaturesInterval = 0;
	
	//XXX
	this.gzip = false;

};

FileFeatureCache.prototype._getChunk = function(position){
	return Math.floor(position/this.chunkSize);
};

FileFeatureCache.prototype.getChunkRegion = function(region){
	start = this._getChunk(region.start) * this.chunkSize;
	end = (this._getChunk(region.end) * this.chunkSize) + this.chunkSize-1;
	return {start:start,end:end};
};

FileFeatureCache.prototype.getFirstFeature = function(){
	var feature;
	if(this.gzip) {
		feature = JSON.parse(RawDeflate.inflate(this.cache[Object.keys(this.cache)[0]].data[0]));
	}else{
		feature = this.cache[Object.keys(this.cache)[0]].data[0];
	}
	return feature;
};


//new 
FileFeatureCache.prototype.getFeatureChunk = function(key){
	if(this.cache[key] != null) {
		return this.cache[key];
	}
	return null;
};
FileFeatureCache.prototype.getFeatureChunkByDataType = function(key,dataType){
	if(this.cache[key] != null) {
        if(this.cache[key][dataType] != null){
		    return this.cache[key][dataType];
        }
	}
	return null;
};
//new
FileFeatureCache.prototype.getFeatureChunksByRegion = function(region){
	var firstRegionChunk, lastRegionChunk,  chunks = [], key;
	firstRegionChunk = this._getChunk(region.start);
	lastRegionChunk = this._getChunk(region.end);
	for(var i=firstRegionChunk; i<=lastRegionChunk; i++){
		key = region.chromosome+":"+i;
		// check if this key exists in cache (features from files)
		if(this.cache[key] != null ){
			chunks.push(this.cache[key]);
		}
		
	}
	//if(chunks.length == 0){
		//return null;
	//}
	return chunks;
};


FileFeatureCache.prototype.putFeaturesByRegion = function(featureDataList, region, featureType, dataType){
	var key, firstRegionChunk, lastRegionChunk, firstChunk, lastChunk, feature, gzipFeature;


	//initialize region
	firstRegionChunk = this._getChunk(region.start);
	lastRegionChunk = this._getChunk(region.end);

	for(var i=firstRegionChunk; i<=lastRegionChunk; i++){
		key = region.chromosome+":"+i;
		if(this.cache[key]==null){
			this.cache[key] = {};
			this.cache[key].key = key;
		}
//        else{
//            // TODO
//            console.log(region.chromosome+region.start+region.end+'-'+featureType+'-'+dataType);
////            return;
//        }
		if(this.cache[key][dataType]==null){
			this.cache[key][dataType] = [];
		}
	}

    //Check if is a single object
    if(featureDataList.constructor != Array){
        featureDataList = [featureDataList];
    }

    //loop over features and set on corresponding chunks
	for(var index = 0, len = featureDataList.length; index<len; index++) {
		feature = featureDataList[index];
		feature.featureType = featureType;
		firstChunk = this._getChunk(feature.start);
		lastChunk = this._getChunk(feature.end);
		
		if(this.gzip) {
			gzipFeature = RawDeflate.deflate(JSON.stringify(feature));
		}else{
			gzipFeature = feature;
		}
		
		for(var i=firstChunk; i<=lastChunk; i++) {
			if(i >= firstRegionChunk && i<= lastRegionChunk){//only if is inside the called region
				key = region.chromosome+":"+i;
				this.cache[key][dataType].push(gzipFeature);
			}
		}
	}
//        console.log(this.cache[region.chromosome+":"+firstRegionChunk][dataType].length)
};


//used by BED, GFF, VCF
FileFeatureCache.prototype.putFeatures = function(featureDataList, dataType){
	var feature, key, firstChunk, lastChunk;

	//Check if is a single object
	if(featureDataList.constructor != Array){
		featureDataList = [featureDataList];
	}

	for(var index = 0, len = featureDataList.length; index<len; index++) {
		feature = featureDataList[index];
		firstChunk = this._getChunk(feature.start);
		lastChunk = this._getChunk(feature.end);
		for(var i=firstChunk; i<=lastChunk; i++) {
			key = feature.chromosome+":"+i;
			if(this.cache[key]==null){
				this.cache[key] = [];
				this.cache[key].key = key;
			}
			if(this.cache[key][dataType]==null){
				this.cache[key][dataType] = [];
			}
			if(this.gzip) {
				this.cache[key][dataType].push(RawDeflate.deflate(JSON.stringify(feature)));
			}else{
				this.cache[key][dataType].push(feature);
			}

		}
	}
};



FileFeatureCache.prototype.putChunk = function(key, item){
	this.cache[key] = item;
};

FileFeatureCache.prototype.getChunk = function(key){
	return this.cache[key];
};

FileFeatureCache.prototype.putCustom = function(f){
	f(this);
};

FileFeatureCache.prototype.getCustom = function(f){
	f(this);
};



FileFeatureCache.prototype.remove = function(region){
	var firstChunk = this._getChunk(region.start);
	var lastChunk = this._getChunk(region.end);
	for(var i=firstChunk; i<=lastChunk; i++){
		var key = region.chromosome+":"+i;
		this.cache[key] = null;
	}
};

FileFeatureCache.prototype.clear = function(){
		this.size = 0;		
		this.cache = {};
};


//END



//THOSE METHODS ARE NOT USED



/*
FileFeatureCache.prototype.getFeaturesByChunk = function(key, dataType){
	var features =  [];
	var feature, firstChunk, lastChunk;
	
	if(this.cache[key] != null && this.cache[key][dataType] != null) {
		for ( var i = 0, len = this.cache[key][dataType].length; i < len; i++) {
			if(this.gzip) {
				feature = JSON.parse(RawDeflate.inflate(this.cache[key][dataType][i]));
			}else{
				feature = this.cache[key][dataType][i];
			}
			
			//check if any feature chunk has been already displayed 
			var displayed = false;
			firstChunk = this._getChunk(feature.start);
			lastChunk = this._getChunk(feature.end);
			for(var f=firstChunk; f<=lastChunk; f++){
				var fkey = feature.chromosome+":"+f;
				if(this.chunksDisplayed[fkey+dataType]==true){
					displayed = true;
					break;
				}
			}
			
			if(!displayed){
				features.push(feature);
				returnNull = false;
			}
		}
		this.chunksDisplayed[key+dataType]=true;
		return features;
	}
	
	return null;
};


FileFeatureCache.prototype.getFeaturesByRegion = function(region, dataType){
	var firstRegionChunk, lastRegionChunk, firstChunk, lastChunk, features = [], feature, key, returnNull = true, displayed;
	firstRegionChunk = this._getChunk(region.start);
	lastRegionChunk = this._getChunk(region.end);
	for(var i=firstRegionChunk; i<=lastRegionChunk; i++){
		key = region.chromosome+":"+i;
		 //check if this key exists in cache (features from files)
		if(this.cache[key] != null && this.cache[key][dataType] != null){
			for ( var j = 0, len = this.cache[key][dataType].length; j < len; j++) {
				if(this.gzip) {
					try {
						feature = JSON.parse(RawDeflate.inflate(this.cache[key][dataType][j]));
					} catch (e) {
						//feature es "" 
						console.log(e)
						debugger
						
					}
					
				}else{
					feature = this.cache[key][dataType][j];
				}
				// we only get those features in the region AND check if chunk has been already displayed
				if(feature.end > region.start && feature.start < region.end){

			//		 check displayCheck argument 
					if(region.displayedCheck != false){
				//		check if any feature chunk has been already displayed 
						displayed = false;
						firstChunk = this._getChunk(feature.start);
						lastChunk = this._getChunk(feature.end);
						for(var f=firstChunk; f<=lastChunk; f++){
							var fkey = region.chromosome+":"+f;
							if(this.chunksDisplayed[fkey+dataType]==true){
								displayed = true;
								break;
							}
						}
						
						if(!displayed){
							features.push(feature);
							returnNull = false;
						}
					}else{
						features.push(feature);
						returnNull = false;
					}

					
				}
			}
		}
		 //check displayCheck argument 
		if(region.displayedCheck != false){
			this.chunksDisplayed[key+dataType]=true;//mark chunk as displayed
		}
	}
	if(returnNull){
		return null;
	}else{
		return features;
	}
};
*/




/*

FileFeatureCache.prototype.putChunk = function(featureDataList, chunkRegion, dataType){
	var feature, key, chunk;
	chunk = this._getChunk(chunkRegion.start);
	key = chunkRegion.chromosome+":"+chunk;

	if(this.cache[key]==null){
		this.cache[key] = [];
	}
	if(this.cache[key][dataType]==null){
		this.cache[key][dataType] = [];
	}

	if(featureDataList.constructor == Object){
		if(this.gzip) {
			this.cache[key][dataType].push(RawDeflate.deflate(JSON.stringify(featureDataList)));
		}else{
			this.cache[key][dataType].push(featureDataList);
		}
	}else{
		for(var index = 0, len = featureDataList.length; index<len; index++) {
			feature = featureDataList[index];
			if(this.gzip) {
				this.cache[key][dataType].push(RawDeflate.deflate(JSON.stringify(feature)));
			}else{
				this.cache[key][dataType].push(feature);
			}
		}
	}
	
};

*/


//NOT USED dev not tested
//FileFeatureCache.prototype.histogram = function(region, interval){
//
	//var intervals = (region.end-region.start+1)/interval;
	//var intervalList = [];
	//
	//for ( var i = 0; i < intervals; i++) {
		//var featuresInterval = 0;
		//
		//var intervalStart = i*interval;//deberia empezar en 1...
		//var intervalEnd = ((i+1)*interval)-1;
		//
		//var firstChunk = this._getChunk(intervalStart+region.start);
		//var lastChunk = this._getChunk(intervalEnd+region.start);
		//
		//console.log(this.cache);
		//for(var j=firstChunk; j<=lastChunk; j++){
			//var key = region.chromosome+":"+j;
			//console.log(key);
			//console.log(this.cache[key]);
			//for ( var k = 0, len = this.cache[key].length; k < len; k++) {
				//if(this.gzip) {
					//feature = JSON.parse(RawDeflate.inflate(this.cache[key][k]));
				//}else{
					//feature = this.cache[key][k];
				//}
				//if(feature.start > intervalStart && feature.start < intervalEnd);
				//featuresInterval++;
			//}
			//
		//}
		//intervalList[i]=featuresInterval;
		//
		//if(this.maxFeaturesInterval<featuresInterval){
			//this.maxFeaturesInterval = featuresInterval;
		//}
	//}
	//
	//for ( var inter in  intervalList) {
		//intervalList[inter]=intervalList[inter]/this.maxFeaturesInterval;
	//}
//};
/**
 * Created with IntelliJ IDEA.
 * User: imedina
 * Date: 10/8/13
 * Time: 12:42 AM
 *
 * This API is asynchronous. When a return value is expected, you must provide a callback function.
 *
 * This class works this way:
 *
 * before executing any request ( get, put, ...),
 * make sure the DataBase connection is alive (this.db) // TODO not yet
 * if the connection is dead: reconnect.
 * make the request to indexedDB.
 */


var iDBInstances = [];
var iDBVersion = 1;
function IndexedDBStore(args) {
    var _this = this;
    this.debug = false;
    this.profile = false;
//debugger
    // Using Underscore 'extend' function to extend and add Backbone Events
    _.extend(this, Backbone.Events);

    this.lru = [];

    this.cacheId = "DataBase";
//    this.objectStore = "ObjectStore";
    this.opening = false;
    this.timeout = 30;  // time to wait if the DB connection is being already opened
    // Now we set the args parameters
    // must be the last instruction in order to overwrite default attributes
    _.extend(this, args);

    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
//    this.db = null;
    this.version = iDBVersion;

    if (!this.cacheId) {
        console.log("IndexedDBStore: not supplied cacheId to constructor. Using default DataBase...");
    }

    iDBInstances.push(this);
//        if (!window.indexedDB) {
//            window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
//        }
    /*
     this._getConnection(function (db) {
     console.log("obtained initial IndexedDB connection for " + _this.cacheId);
     console.log(db);
     });
     */
}

IndexedDBStore.prototype = {
    _getConnection: function (objectStoreName, callback, version) {
        var _this = this;
        if (_this.debug) {
            console.log(_this.cacheId + " opening? " + _this.opening);
            if (objectStoreName == undefined) {
                console.log("WARNING: requested to create objectStore 'undefined'");
                debugger
            }
//        debugger
        }
        if (_this.opening == true) {
            if (_this.debug) {
                console.log("Database " + _this.cacheId + " is already opening. To avoid block: waiting...");
            }
            setTimeout(_this._getConnection.bind(_this), _this.timeout * (1 + Math.random()*0.25), objectStoreName, callback, version);
            /*} else if (dbConnection && !dbConnection.closed && dbConnection.objectStoreNames.contains(objectStoreName)) { // recycle connections
             if (_this.debug) {
             console.log("Database already opened:", dbConnection);
             }
             callback(dbConnection);*/
        } else {
            try {
                if (_this.debug) {
                    console.log("trying opening Database:" + _this.cacheId);
                }
                var dbOpenRequest;
                _this.opening = true;
                if (_this.debug) {
                    console.log("lock:"+_this.cacheId + ", " + objectStoreName + " opening = "+ _this.opening + " version: " + version);
                }
                if (!_.isUndefined(version)) {
                    dbOpenRequest = window.indexedDB.open(_this.cacheId, version); // second parameter is the version. increase to modify tables.
                } else {
                    dbOpenRequest = window.indexedDB.open(_this.cacheId);
                }
                dbOpenRequest.onsuccess = function (event) {
                    _this.opening = false;
                    if (_this.debug) {
                        console.log("unlock:" + _this.cacheId + ", " + objectStoreName + " opening = " + _this.opening);
                    }
//                    if (dbConnection) {
//                        console.log("overwriting DB", dbConnection, " with", event.target.result);
//                        debugger;
//                        dbConnection.close();
//                        dbConnection.closed = true;
//                        dbConnection = undefined;
//                    }
                    var dbConnection = event.target.result;

                    dbConnection.onversionchange = function (e) {
                        if (_this.debug) {
                            console.log("Version change triggered, so closing database connection " + _this.cacheId + ", " + objectStoreName + " (old version, new version, db, event)", e.oldVersion, e.newVersion, dbConnection, e);
                        }
                        if (dbConnection) {
                            dbConnection.close();
                            dbConnection.closed = true;
                            dbConnection = undefined;
                        }
                    };

                    if (objectStoreName != "" && !dbConnection.objectStoreNames.contains(objectStoreName)) {
                        iDBVersion = Math.max(iDBVersion, dbConnection.version) + 1;
                        dbConnection.close();
                        dbConnection.closed = true;
                        dbConnection = undefined;
                        _this.version = iDBVersion;
                        if (_this.debug) {
                            console.log("needed ObjectStore " + objectStoreName + " in " + _this.cacheId + " creating version " + iDBVersion);
                        }
                        _this._getConnection(objectStoreName, callback, _this.version);
                    } else {
                        if (_this.debug) {
                            console.log("connection obtained for " + _this.cacheId + " and " + objectStoreName, dbConnection);
                        }
                        callback(dbConnection);
                    }
                };
                dbOpenRequest.onupgradeneeded = function (e) {
                    if (_this.debug) {
                        console.log("Database upgrade needed in " + _this.cacheId + ", " + objectStoreName);
                    }
                    dbConnection = e.target.result;

                    if (!dbConnection.objectStoreNames.contains(objectStoreName)) {
                        if (_this.debug) {
                            console.log("creating " + objectStoreName + " in Database " + _this.cacheId );
                        }
                        var objectStore = dbConnection.createObjectStore(objectStoreName);
                    }
                };
                dbOpenRequest.onerror = function (e) {
                    console.log("DB Open Request Error in " + _this.cacheId + ", " + objectStoreName);
                    console.log(e);
                };
                dbOpenRequest.onblocked = function (e) {
                    console.log("DB Open Request Blocked in " + _this.cacheId + ", " + objectStoreName, e);
//                    if (dbConnection) {
//                        dbConnection.close();
//                    }
                    _this._getConnection(objectStoreName, callback)
                };
            } catch (e) {
                console.log("catch error:");
                console.error(e);
            }
        }
    },

    clear: function (objectStoreName) {
//        this.db.deleteObjectStore(this.cacheId);

        var _this = this;
        _this._getConnection(objectStoreName, function(dbConnection){
            var transaction = dbConnection.transaction([objectStoreName], "readwrite");
            transaction.oncomplete = function(event) {
                console.log("IndexedDB " + _this.cacheId + ", " + objectStoreName + " clear success!");
            };
            var objectStore = transaction.objectStore(objectStoreName);
            var req = objectStore.clear();
            req.onerror = function (evt) {
                console.log("IndexedDB Error trying to clear the object store " + objectStoreName + " in " + _this.cacheId);
            }
        });
    },

    count: function (objectStoreName, callback) {
        var _this = this;
        _this._getConnection(objectStoreName, function(dbConnection){
            var transaction = dbConnection.transaction([objectStoreName], "readwrite");
            var objectStore = transaction.objectStore(objectStoreName);
            var req = objectStore.count();
            req.onerror = function (evt) {
                console.log("IndexedDB Error trying to count the object store " + objectStoreName + " in " + _this.cacheId);
            };
            req.onsuccess = function (event) {
                callback(event.target.result);
            }
        });
    },

    getObjectStoreNames: function (callback) {
        var _this = this;
        _this._getConnection("", function(dbConnection){
            callback(dbConnection.objectStoreNames);
        });
    },

    close: function () {
        var _this = this;
        _this._getConnection(objectStoreName, function(dbConnection){
            dbConnection.close();
            console.log("Database " + _this.cacheId + " closed");
            dbConnection.closed=true;
            dbConnection = undefined;
        });
    },

    destroyDB: function() {
        var _this = this;
        try {
            var dbDeleteRequest = window.indexedDB.deleteDatabase(_this.cacheId);
            dbDeleteRequest.onsuccess = function (e) {
                console.log("Database " + _this.cacheId + " successfully deleted");
            };
            dbDeleteRequest.onupgradeneeded = function (e) {
                var db = dbOpenRequest.result;
                console.log("Deleting Database upgrade needed");
                /* Code for ${db.upgrade} */
            };
            dbDeleteRequest.onerror = function (e) {
                console.log("Error deleting DB" + _this.cacheId);
                console.log(e);
            };
            dbDeleteRequest.onblocked = function (e) {
                console.log("Deleting DB Blocked. Try closing the database " + _this.cacheId + " and then deleting it");
            };
        } catch (e) {
            console.log(e);
        }

    },

    destroyDBs: function() {
        for (var i = 0; i < iDBInstances.length; i++){
            iDBInstances[i].close();
            iDBInstances[i].destroyDB();
        }
    },


    get: function(objectStoreName, key, callback) {
        var timeId;
        var _this = this;
        if (_this.debug) {
            timeId = "IndexedDBStore.get " + objectStoreName + key;
            console.time(timeId);
        }
        var result = null;
        _this._getConnection(objectStoreName, function (dbConnection) {
            var transaction = dbConnection.transaction([objectStoreName], "readonly");
            transaction.oncomplete = function(event) {
                if (_this.debug) {
                    console.timeEnd(timeId);
                }
                dbConnection.close();
                callback(result);
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction get (" + key + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(objectStoreName);
            var request = objectStore.get(key);
            request.onsuccess = function (event) {
                result = event.target.result;
            };
        });
    },


    /**
     * Calls the callback ONCE. As a parameter there is an Array with all the values.
     * @param keyArray
     * @param callback (valuesArray) The order is the same as in the keyArray.
     */
    getAll: function(objectStoreName, keyArray, callback) {
        var _this = this;
        var timeId;
        if (_this.profile || _this.debug) {
            timeId = "IndexedDBStore.getAll " + objectStoreName + ", with " + keyArray.length + " keys.";
            console.time(timeId);
        }
        if (!(keyArray instanceof Array) || !callback) {
            console.error("Bad use of IndexedDBStore: getAll must receive an ObjectStoreName, an Array of keys and a callback function.");
            return;
        }
        var results = new Array(keyArray.length);

        _this._getConnection(objectStoreName, function (dbConnection) {
            var transaction = dbConnection.transaction([objectStoreName], "readonly");
            transaction.oncomplete = function(event) {
                if (_this.profile || _this.debug) {
                    console.timeEnd(timeId);
                }
                dbConnection.close();
                callback(results);
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction get (" + keyArray + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(objectStoreName);

            for (var i = 0; i < keyArray.length; i++) {
                var request = objectStore.get(keyArray[i]);

                request.onsuccess = function (iteration) {
                    return function (event) {
                        results[iteration] = event.target.result;
                    };
                } (i);     // to force the closure to have each value of i, and not just the last one
            }
        });
    },

    /**
     * Calls the callback with the value of each key. The callback is called keyArray.length times.
     * @param callback (value, key, i) Receives as parameters the value, its key, and the position of the key in the keyArray.
     * @param whenCompletedCallback Optional. Receives no arguments. it is called when all callbacks have finished.
     */
    foreach: function(objectStoreName, keyArray, callback, whenCompletedCallback) {
        if (!(keyArray instanceof Array) || !callback) {
            console.error("Bad use of IndexedDBStore: foreach must receive an ObjectStoreName, an Array of keys and a callback function.");
            return;
        }
        var _this = this;
        var timeId;
        if (_this.profile || _this.debug) {
            timeId = "IndexedDBStore.getAll " + objectStoreName + ", with " + keyArray.length + " keys.";
            console.time(timeId);
        }

        _this._getConnection(objectStoreName, function (dbConnection) {
            var transaction = dbConnection.transaction([objectStoreName], "readonly");
            transaction.oncomplete = function(event) {
                dbConnection.close();
                if (_this.profile || _this.debug) {
                    console.timeEnd(timeId);
                }
                if (whenCompletedCallback) {
                    whenCompletedCallback();
                }
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction foreach (" + keyArray + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(objectStoreName);

            for (var i = 0; i < keyArray.length; i++) {
                var request = objectStore.get(keyArray[i]);

                request.onsuccess = function (iteration) {
                    return function (event) {
                        callback(event.target.result, keyArray[iteration], iteration);
                    };
                } (i);     // to force the closure to have each value of i, and not just the last one
            }
        });
    },

    add: function(objectStoreName, key, value) {
        var _this = this;

        _this._getConnection(objectStoreName, function(dbConnection) {
            var transaction = dbConnection.transaction([objectStoreName], "readwrite");

            transaction.onerror = function (event) {
                console.log("There was an error in the transaction add (" + key + ", " + value + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(objectStoreName);
            var request = objectStore.add(value, key);    // as the key is optional depending on the database scheme, it is the 2nd parameter
        });
    },

    put: function(objectStoreName, key, value) {
        var _this = this;
        var timeId;
        if (_this.debug) {
            timeId = "IndexedDBStore.put " + objectStoreName + key;
            console.time(timeId);
        }

        _this._getConnection(objectStoreName, function(dbConnection) {
            var transaction = dbConnection.transaction([objectStoreName], "readwrite");
            transaction.oncomplete = function(event) {
                if (_this.debug) {
                    console.timeEnd(timeId);
                }
                dbConnection.close();
                dbConnection.close = true;
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction put(" + key + ", ", value, ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(objectStoreName);
            var request = objectStore.put(value, key);    // as the key is optional depending on the database scheme, it is the 2nd parameter
        });
    },

    putAll: function(objectStoreName, keyArray, valueArray) {
        var _this = this;
        var timeId;
        if (_this.profile || _this.debug) {
            timeId = "IndexedDBStore.putAll " + objectStoreName + ", with " + keyArray.length;
            console.time(timeId);
        }

        if (!(keyArray instanceof Array) || !(valueArray instanceof Array) || (keyArray.length != valueArray.length)) {
            console.error("Bad use of IndexedDBStore: putAll must receive two Arrays of the same length.");
            return;
        }

        _this._getConnection(objectStoreName, function(dbConnection) {
            var transaction = dbConnection.transaction([objectStoreName], "readwrite");
            transaction.oncomplete = function(event) {
                if (_this.profile || _this.debug) {
                    console.timeEnd(timeId);
                }
                dbConnection.close();
                dbConnection.close = true;
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction putAll(" + keyArray + ", ", valueArray, ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(objectStoreName);

            for (var i = 0; i < keyArray.length; i++) {
                objectStore.put(valueArray[i], keyArray[i]);    // as the key is optional depending on the database scheme, it is the 2nd parameter
            }
        });
    },


    delete: function(objectStoreName, key) {
        var _this = this;

        _this._getConnection(objectStoreName, function(dbConnection) {
            var transaction = dbConnection.transaction([objectStoreName], "readwrite");
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction delete (" + key + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(objectStoreName);
            var request = objectStore.delete(key);    // as the key is optional depending on the database scheme, it is the 2nd parameter

        });
    }
};

IndexedDBTest = function () {
    var idb = new IndexedDBStore({cacheId: "test"});
    idb.put("os-a", "key-a", "value-a");
    idb.put("os-b", "key-b", "value-b");
};

IndexedDBTest();
//debugger
/*
 * Copyright 2015 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by imedina on 21/03/16.
 */

class IndexedDBCache {

    constructor(database) {
        this.database = database || "example_cache";
        this.status = "close";
        this.request = null;
        this.db = null;
    }

    createObjectStores(os) {

        if (os === undefined || !os instanceof Array) {
            return;
        }

        let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
        let request = indexedDB.open(this.database, 11);

        request.onupgradeneeded = function(event) {
            var db = event.target.result;

            db.onerror = function(event) {
                console.log("Error loading database.");
            };

            // Create an objectStore for this database
            for (let i in os) {
                db.createObjectStore(os[i], { autoIncrement : true });
            }

        };
    }

    open(os, callback) {
        var database = this.database;
        this.status = "opening";
        var _this = this;

        // var dbOpenRequest = indexedDB.open(database, 2);
        let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
        var request = indexedDB.open(database, 11);
        var db;
        request.onsuccess = function (event) {
            this.status = "open";
            console.log(database + " is " + _this.status);
            db = request.result;

            db.onversionchange = function (e) {
                // if (db) {
                //     db.close();
                //     // dbConnection.closed = true;
                //     db  = undefined;
                // }
                console.log(os)
                db.createObjectStore(os);
            };

            console.log(db)
            callback(db);
        };

        request.onupgradeneeded = function (event) {
            console.debug("onupgrade");
            // console.log(event)
            db = request.result;
            // var objectStore = data.createObjectStore(objectStoreName);
            if (!db.objectStoreNames.contains(os)) {
                db.createObjectStore(os);
            }
        };

        request.onerror = function (event) {
            // console.log(event)
            console.error("DB Open Request Error in " + database);
        };
        this.request = request;
    }

    close() {

    }

    clear(os) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readwrite");
            let objectStore = transaction.objectStore(os);
            objectStore.clear(os);
        });
    }

    count(os, callback) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readonly");
            let objectStore = transaction.objectStore(os);
            var request = objectStore.count();
            request.onsuccess = function (event) {
                callback(event.target.result);
            }
        });
    }

    delete(os, key) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readwrite");
            let objectStore = transaction.objectStore(os);
            objectStore.delete(key);
        });
    }

    deleteDatabase() {
        var _this = this;
        try {
            var dbDeleteRequest = window.indexedDB.deleteDatabase(this.database);
            dbDeleteRequest.onsuccess = function (e) {
                console.log("Database " + _this.database + " successfully deleted");
            };
            dbDeleteRequest.onupgradeneeded = function (e) {
                var db = dbOpenRequest.result;
                console.log("Deleting Database upgrade needed");
            };
            dbDeleteRequest.onerror = function (e) {
                console.log("Error deleting DB" + _this.database);
                console.log(e);
            };
            dbDeleteRequest.onblocked = function (e) {
                console.log("Deleting DB Blocked. Try closing the database " + _this.database + " and then deleting it");
            };
        } catch (e) {
            console.log(e);
        }
    }

    get(os, key, callback) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readonly");
            let objectStore = transaction.objectStore(os);
            var request = objectStore.get(key);
            request.onsuccess = function (event) {
                callback(event.target.result);
            }
        });
    };

    getAll(os, keyArray, callback) {
        let _this = this;
        let results = new Array(keyArray.length);
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readonly");
            transaction.oncomplete = function (event) {
                console.debug("Transaction has completed with: '" + event.type + "'");
                db.close();
                db.close = true;
                callback(results);
            };
            let objectStore = transaction.objectStore(os);
            for (let i = 0; i < keyArray.length; i++) {
                let request = objectStore.get(keyArray[i]);
                request.onsuccess = function (iteration) {
                    return function (event) {
                        results[iteration] = event.target.result;
                    };
                } (i);
            }
        });
    }

    /**
     * Calls the callback with the value of each key. The callback is called keyArray.length times.
     * @param callback (value, key, i) Receives as parameters the value, its key, and the position of the key in the keyArray.
     * @param whenCompletedCallback Optional. Receives no arguments. it is called when all callbacks have finished.
     */
    foreach(os, keyArray, callback, whenCompletedCallback) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readonly");
            transaction.oncomplete = function (event) {
                console.log("Transaction has completed with: '" + event.type + "'");
                db.close();
                db.close = true;
                if (typeof whenCompletedCallback != "undefined") {
                    whenCompletedCallback();
                }
            };
            let objectStore = transaction.objectStore(os);
            for (let i = 0; i < keyArray.length; i++) {
                let request = objectStore.get(keyArray[i]);
                request.onsuccess = function (iteration) {
                    return function (event) {
                        callback(event.target.result, keyArray[iteration], iteration);
                    };
                } (i); // to force the closure to have each value of i, and not just the last one
            }
        });
    }

    add(os, key, value) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readwrite");
            let objectStore = transaction.objectStore(os);
            objectStore.add(value, key);
        });
    }

    addAll(os, keyArray, valueArray) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readwrite");
            let objectStore = transaction.objectStore(os);
            for (let i = 0; i < keyArray.length; i++) {
                objectStore.put(valueArray[i], keyArray[i]);
            }
        });
    }

    put(os, key, value) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readwrite", "Put: ");
            let objectStore = transaction.objectStore(os);
            objectStore.put(value, key);
        });
    }

    putAll(os, keyArray, valueArray) {
        var _this = this;
        this.open(os, function (db) {
            let transaction = _this._createTransaction(db, os, "readwrite");
            let objectStore = transaction.objectStore(os);
            for (let i = 0; i < keyArray.length; i++) {
                objectStore.put(valueArray[i], keyArray[i]);
            }
        });
    }



    _createTransaction(db, os, mode, prefix = "") {
        if (typeof os == "string") {
            os = os.split(",");
        }

        let transaction = db.transaction(os, mode);
        transaction.oncomplete = function(event) {
            console.log(prefix + "Transaction has completed with: '" + event.type + "'");
            db.close();
            db.close = true;
        };

        transaction.onerror = function(event) {
            console.log(prefix + "There was an error in the transaction: " + event.target.error.message);
            console.log(event);
        };
        return transaction;
    }

    // _error(event) {
    //     console.log("There was an error in the transaction: " + event.target.error.message);
    //     console.log(event);
    // }

    _checkParams(obj) {

    }
}/**
 * Created with IntelliJ IDEA.
 * User: imedina
 * Date: 10/8/13
 * Time: 12:40 AM
 * To change this template use File | Settings | File Templates.
 */

/**
 * MemoryStore is a cache with items ordered with "least recently used" criterion (LRU). This allows to remove old data with the "shift" method.
 * The parameter "category" should be a string, and it is used as another level of classification.
 * "get", "getAll" and "foreach" methods can be used with callbacks or with return values.
 */
function MemoryStore(args) {

    // Using Underscore 'extend' function to extend and add Backbone Events
    _.extend(this, Backbone.Events);

    // configurable parameters
    //    this.limit = 500;

    // Now we set the args parameters
    _.extend(this, args);

    this.init();
};

MemoryStore.prototype = {
    put: function (category, key, value) {
        if (typeof this.stores[category] === 'undefined') {
            this.init(category);
        }
        var item = {
            key: key,
            value: value
        };

        // a item can be overwritten
        this.stores[category][key] = item;

        if (this.tails[category]) {
            this.tails[category].newer = item;
            item.older = this.tails[category];
        } else {
            // the item is the first one
            this.heads[category] = item;
        }

        // add new item to the end of the linked list, it's now the freshest item.
        this.tails[category] = item;

        //        if (this.size === this.limit) {
        //            // we hit the limit, remove the head
        //            this.shift();
        //        } else {
        //            // increase the size counter
        //            this.size++;
        //        }
        this.sizes[category]++;

    },
    putAll: function (category, keyArray, valueArray) {
        for (var i = 0; i < keyArray.length; i++) {
            this.put(category, keyArray[i], valueArray[i]);
        }
    },

    shift: function (category) {
        if (typeof this.stores[category] === 'undefined') {
            this.init(category);
        }
        // todo: handle special case when limit == 1
        var item = this.heads[category];
        if (item) {
            if (this.heads[category].newer) {
                this.heads[category] = this.heads[category].newer;
                this.heads[category].older = undefined;
            } else {
                this.heads[category] = undefined;
            }
            // Remove last strong reference to <item> and remove links from the purged
            // item being returned:
            item.newer = item.older = undefined;
            // delete is slow, but we need to do this to avoid uncontrollable growth:
            delete this.stores[category][item.key];
        }
    },
    get: function (category, key, callback) {
        if (typeof this.stores[category] === 'undefined') {
            this.init(category);
        }
        // First, find our cache item
        var item = this.stores[category][key];
        if (item === undefined) {
            if (callback) {
                callback();
            }
            return; // Not cached. Sorry.
        }
        // As <key> was found in the cache, register it as being requested recently
        if (item === this.tails[category]) {
            // Already the most recenlty used item, so no need to update the list
            if (callback) {
                callback(item.value);
            }
            return item.value;
        }
        // HEAD--------------TAIL
        //   <.older   .newer>
        //  <--- add direction --
        //   A  B  C  <D>  E
        if (item.newer) {
            if (item === this.heads[category]) {
                this.heads[category] = item.newer;
            }
            item.newer.older = item.older; // C <-- E.
        }
        if (item.older) {
            item.older.newer = item.newer; // C. --> E
        }
        item.newer = undefined; // D --x
        item.older = this.tails[category]; // D. --> E
        if (this.tails[category])
            this.tails[category].newer = item; // E. <-- D
        this.tails[category] = item;
        if (callback) {
            callback(item.value);
        }
        return item.value;
    },

    getAll: function (category, keyArray, callback) {
        var valueArray = [];
        for (var i = 0; i < keyArray.length; i++) {
            valueArray[i] = this.get(category, keyArray[i]);
        }
        callback(valueArray);
    },

    foreach: function (category, keyArray, callback) {
        for (var i = 0; i < keyArray.length; i++) {
            callback(this.get(category, keyArray[i]), keyArray[i]);
        }
    },

    init: function (category) {
        if (category != undefined) {
            this.sizes[category] = 0;
            this.stores[category] = {};
            this.heads[category] = undefined;
            this.tails[category] = undefined;
        } else {
            this.sizes = {};
            this.stores = {};
            this.heads = {};
            this.tails = {};
        }
    },
    clear: function () {
        this.stores = null; // TODO delete?
        this.init();
    },
    
    delete: function () {
        this.clear();
    }

    //    get: function (key) {
    //        if (typeof this.dataStore === 'undefined') {
    //            return undefined;
    //        } else {
    //            var ms = this.counter++;
    //            this.dataStore[key].ms = ms;
    //            return this.dataStore[key].data;
    //        }
    //    },

    //    addCollection: function (key, featureArray) {
    //        // If 'featureArray' is an Array then we add all elements,
    //        // otherwise we call to add()
    //        if ($.isArray(featureArray)) {
    //            if (typeof this.dataStore === 'undefined') {
    //                this.dataStore = {};
    //            }
    //            for (var feature in featureArray) {
    //                this.dataStore[key] = feature;
    //                this.lru.push({key: key, ms: this.counter});
    //            }
    //        } else {
    //            this.add(key, featureArray);
    //        }
    //    },

    //    delete: function (key) {
    //        if (typeof this.dataStore !== 'undefined') {
    //            var aux = this.dataStore[key];
    //            delete this.dataStore[key];
    //            return aux;
    //        }
    //    },

    //    free: function () {
    //        this.lru = [];
    //        for (var i in this.dataStore) {
    //            this.lru.push({key: i, ms: this.dataStore[i].ms});
    //        }
    //        this.lru.sort(function (a, b) {
    //            return a.ms - b.ms;
    //        });
    //        this.delete(this.lru[0].key);
    //        this.lru.splice(0, 1);
    //    },
    //
    //    close: function () {
    //        this.dataStore = null;
    //    }
};
class PolymerUtils {

    static isNotEmptyValueById(id) {
        const value = PolymerUtils.getValue(id);
        return typeof value !== 'undefined' && value !== null && value !== '';
    }


    static getValue(id) {
        return PolymerUtils.getPropertyById(id, 'value');
    }

    static setValue(id, value) {
        return PolymerUtils.setPropertyById(id, 'value', value);
    }


    static getElementById(id) {
        return document.getElementById(id);
    }

    static getElementsByClassName(className, element) {
        if (UtilsNew.isUndefined(element)) {
            return document.getElementsByClassName(className);
        }
        // If element is a string we do first a getElementById, if it exist we execute the query
        if (typeof element === 'string') {
            const elem = PolymerUtils.getElementById(element);
            if (elem !== undefined && elem !== null) {
                return element.getElementsByClassName(className);
            }
            // The given element id does not exist
            return undefined;
        }
        // Element exists and it is not a string, it must be a object
        return element.getElementsByClassName(className);
    }

    static querySelector(selectors, element) {
        if (UtilsNew.isUndefinedOrNull(element)) {
            return document.querySelector(selectors);
        }
        // If element is a string we do first a getElementById, if it exist we execute the query
        if (typeof element === 'string') {
            const elem = PolymerUtils.getElementById(element);
            if (elem !== undefined && elem !== null) {
                return elem.querySelector(selectors);
            }
            // The given element id does not exist
            return undefined;
        }
        // Element exists and it is not a string, it must be a object
        return element.querySelector(selectors);
    }

    static querySelectorAll(selectors, element) {
        if (UtilsNew.isUndefinedOrNull(element)) {
            return document.querySelectorAll(selectors);
        }
        // If element is a string we do first a getElementById, if it exist we execute the query
        if (typeof element === 'string') {
            const elem = PolymerUtils.getElementById(element);
            if (elem !== undefined && elem !== null) {
                return elem.querySelectorAll(selectors);
            }
            // The given element id does not exist
            return undefined;
        }
        // Element exists and it is not a string, it must be a object
        return element.querySelectorAll(selectors);
    }

    static getTextOptionSelected(id) {
        if (UtilsNew.isNotUndefinedOrNull(id)) {
            const sel = PolymerUtils.getElementById(id);
            if (UtilsNew.isNotUndefinedOrNull(sel)) {
                return sel.options[sel.selectedIndex].text;
            }
            return undefined;
        }
    }


    static show(id, type = 'block') {
        PolymerUtils.addStyle(id, 'display', type);
    }

    static showByClass(className, type = 'block') {
        PolymerUtils.addStyleByClass(className, 'display', type);
    }

    static hide(id) {
        PolymerUtils.addStyle(id, 'display', 'none');
    }

    static hideByClass(className) {
        PolymerUtils.addStyleByClass(className, 'display', 'none');
    }


    static addClass(id, className) {
        if (UtilsNew.isNotUndefinedOrNull(id)) {
            let el;
            if (id.startsWith('.')) {
                // If starts with a dot then is a class, we use querySelector
                el = PolymerUtils.querySelector(id);
            } else {
                // It is an ID
                el = PolymerUtils.getElementById(id);
            }

            if (Array.isArray(className)) {
                if (!UtilsNew.isUndefinedOrNull(el)) {
                    className.forEach((item) => {
                        el.classList.add(item);
                    });
                }
            } else {
                el.classList.add(className);
            }
        }
    }

    static removeClass(id, className) {
        if (UtilsNew.isNotUndefinedOrNull(id)) {
            let el;
            if (id.startsWith('.')) {
                // If starts with a dot then is a class, we use querySelector
                el = PolymerUtils.querySelectorAll(id);
            } else {
                // It is an ID
                el = PolymerUtils.getElementById(id);
            }

            if (Array.isArray(className)) {
                if (UtilsNew.isNotUndefinedOrNull(el)) {
                    className.forEach((item) => {
                        el.classList.remove(item);
                    });
                }
            } else if (UtilsNew.isNotUndefinedOrNull(el.length) && el.length > 1) {
                el.forEach((element) => {
                    element.classList.remove(className);
                });
            } else {
                el.classList.remove(className);
            }
        }
    }


    static removeElement(id) {
        if (UtilsNew.isNotUndefinedOrNull(id)) {
            const el = this.getElementById(id);
            if (UtilsNew.isNotUndefinedOrNull(el)) {
                el.parentNode.removeChild(el);
            }
        }
    }

    static addStyle(id, key, value) {
        if (UtilsNew.isNotUndefinedOrNull(id)) {
            const el = PolymerUtils.getElementById(id);
            if (UtilsNew.isNotUndefinedOrNull(el)) {
                el.style[key] = value;
            }
        }
    }


    static addStyleByClass(className, key, value) {
        if (UtilsNew.isNotUndefinedOrNull(className)) {
            const els = PolymerUtils.getElementsByClassName(className);
            if (UtilsNew.isNotUndefinedOrNull(els)) {
                Array.from(els).forEach((element) => {
                    element.style[key] = value;
                });
            }
        }
    }

    static removeStyle(id, key) {
        if (!UtilsNew.isUndefinedOrNull(id)) {
            const el = PolymerUtils.getElementById(id);
            if (!UtilsNew.isUndefinedOrNull(el)) {
                delete el.style[key];
            }
        }
    }

    static removeStyleByClass(className, key) {
        if (UtilsNew.isNotUndefinedOrNull(className)) {
            const els = PolymerUtils.getElementsByClassName(className);
            if (UtilsNew.isNotUndefinedOrNull(els)) {
                Array.from(els).forEach((element) => {
                    delete element.style[key];
                });
            }
        }
    }

    static setAttribute(id, key, value) {
        if (UtilsNew.isNotUndefinedOrNull(key)) {
            const el = PolymerUtils.getElementById(id);
            if (UtilsNew.isNotUndefinedOrNull(el)) {
                el.setAttribute(key, value);
            }
        }
    }

    static removeAttribute(id, key) {
        if (UtilsNew.isNotUndefinedOrNull(key)) {
            const el = PolymerUtils.getElementById(id);
            if (UtilsNew.isNotUndefinedOrNull(el)) {
                el.removeAttribute(key);
            }
        }
    }

    static removeAttributebyclass(className, key) {
        const els = PolymerUtils.getElementsByClassName(className);

        if (UtilsNew.isNotUndefinedOrNull(key)) {
            if (UtilsNew.isNotUndefinedOrNull(els)) {
                Array.from(els).forEach((element) => {
                    element.removeAttribute(key);
                });
            }
        }
    }

    static innerHTML(id, text) {
        const el = PolymerUtils.getElementById(id);
        if (UtilsNew.isNotUndefinedOrNull(el)) {
            el.innerHTML = text;
        }
    }


    static innerHtmlByClass(className, text) {
        const els = PolymerUtils.getElementsByClassName(className);
        if (UtilsNew.isNotUndefinedOrNull(els)) {
            Array.from(els).forEach((element) => {
                element.innerHTML = text;
            });
        }
    }


    static setPropertyByClassName(className, key, value) {
        const els = PolymerUtils.getElementsByClassName(className);

        if (UtilsNew.isNotUndefinedOrNull(key)) {
            if (UtilsNew.isNotUndefinedOrNull(els)) {
                Array.from(els).forEach((element) => {
                    element[key] = value;
                });
            }
        }
    }

    static setPropertyById(id, key, value) {
        const element = PolymerUtils.getElementById(id);

        if (UtilsNew.isNotUndefinedOrNull(key)) {
            if (UtilsNew.isNotUndefinedOrNull(element)) {
                element[key] = value;
            }
        }
    }

    static getPropertyById(id, key) {
        const element = PolymerUtils.getElementById(id);

        if (UtilsNew.isNotUndefinedOrNull(key)) {
            if (UtilsNew.isNotUndefinedOrNull(element)) {
                return element[key];
            }
        }
    }

    static setAttributeByClassName(className, key, value) {
        const els = PolymerUtils.getElementsByClassName(className);

        if (UtilsNew.isNotUndefinedOrNull(key)) {
            if (UtilsNew.isNotUndefinedOrNull(els)) {
                Array.from(els).forEach((element) => {
                    element.setAttribute(key, value);
                });
            }
        }
    }
}
/**
 * Created by swaathi on 28/03/17.
 */

class VariantUtils {

    static jsonToTabConvert(json, studiesPopFrequencies) {
        let dataString = [];
        let variantString = [];
        let populationMap = {};

        for (var key in json[0]) {
            console.log(key);
        }

        variantString.push("Variant");
        variantString.push("SNP ID");
        variantString.push("Genes");
        variantString.push("Type");
        variantString.push("Consequence Type");
        variantString.push("SIFT");
        variantString.push("Polyphen");
        variantString.push("CADD");
        variantString.push("PhyloP");
        variantString.push("PhastCons");
        variantString.push("GERP");
        // variantString.push("Population frequencies");
        studiesPopFrequencies.forEach((study) => {
            study.populations.forEach(pop => variantString.push(study.id + "_" + pop.id));
        });
        variantString.push("Clinvar");
        variantString.push("Cosmic");
        dataString.push(variantString.join('\t'));
        variantString = [];
        for (let i = 0; i < json.length; i++) {
            variantString.push(json[i].chromosome + ':' + json[i].start + " " + json[i].reference + '/' + json[i].alternate);
            variantString.push(json[i].id);
            let genes = [];
            let ct = [];
            let pfArray  = [];
            let sift, polyphen, cadd = "-", phylop = "-", phastCons = "-", gerp = "-";
            let clinvar = [];
            let cosmic = [];

            if (typeof json[i].annotation !== "undefined") {
                if (typeof json[i].annotation.consequenceTypes !== "undefined" && json[i].annotation.consequenceTypes.length > 0) {
                    let visitedGenes = {};
                    let visitedCT = new Set();
                    for (let j = 0; j < json[i].annotation.consequenceTypes.length; j++) {
                        // gene
                        if (typeof json[i].annotation.consequenceTypes[j].geneName !== "undefined" && json[i].annotation.consequenceTypes[j].geneName != ""
                            && typeof visitedGenes[json[i].annotation.consequenceTypes[j].geneName] === "undefined") {
                            genes.push(json[i].annotation.consequenceTypes[j].geneName);
                            visitedGenes[json[i].annotation.consequenceTypes[j].geneName] = true;
                        }

                        // Consequence Type
                        for (let z = 0; z < json[i].annotation.consequenceTypes[j].sequenceOntologyTerms.length; z++) {
                            let consequenceTypeName = json[i].annotation.consequenceTypes[j].sequenceOntologyTerms[z].name;
                            if (typeof consequenceTypeName !== "undefined" && consequenceTypeName != "" && !visitedCT.has(consequenceTypeName)) {
                                ct.push(consequenceTypeName);
                                visitedCT.add(consequenceTypeName);
                            }
                        }

                        // Sift, Polyphen
                        let min = 10;
                        let max = 0;
                        let description = {};
                        if (typeof json[i].annotation.consequenceTypes[j].proteinVariantAnnotation !== "undefined"
                            && typeof json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores !== "undefined") {
                            for (let ss = 0; ss < json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores.length; ss++) {
                                let source = json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores[ss].source;
                                switch (source) {
                                    case "sift":
                                        if (json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores[ss].score < min) {
                                            min = json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores[ss].score;
                                            description.sift = json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores[ss].description;
                                        }
                                        break;
                                    case "polyphen":
                                        if (json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores[ss].score > max) {
                                            max = json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores[ss].score;
                                            description.polyphen = json[i].annotation.consequenceTypes[j].proteinVariantAnnotation.substitutionScores[ss].description;
                                        }
                                        break;
                                }
                            }
                        }
                        sift = typeof description.sift !== "undefined" ? description.sift : "-";
                        polyphen = typeof description.polyphen !== "undefined" ? description.polyphen : "-";
                    }
                }
                // CADD
                if (typeof json[i].annotation.functionalScore !== "undefined") {
                    for (let fs = 0; fs < json[i].annotation.functionalScore.length; fs++) {
                        if (typeof json[i].annotation.functionalScore[fs] !== "undefined" && json[i].annotation.functionalScore[fs].source == "cadd_scaled") {
                            cadd = Number(json[i].annotation.functionalScore[fs].score).toFixed(2);
                        }
                    }
                }

                // Conservation
                if (typeof json[i].annotation.conservation !== "undefined") {
                    for (let cons = 0; cons < json[i].annotation.conservation.length; cons++) {
                        switch (json[i].annotation.conservation[cons].source) {
                            case "phylop":
                                phylop = Number(json[i].annotation.conservation[cons].score).toFixed(3);
                                break;
                            case "phastCons":
                                phastCons = Number(json[i].annotation.conservation[cons].score).toFixed(3);
                                break;
                            case "gerp":
                                gerp = Number(json[i].annotation.conservation[cons].score).toFixed(3);
                                break;
                        }
                    }
                }

                // Population frequency
                let populations = [];
                let populationStudyBidimensional = [];
                let populationMapExists = [];
                studiesPopFrequencies.forEach((study) => {
                    populations[study.id] = study.populations.map(pop => pop.id);
                    study.populations.forEach((pop) => {
                        populationMapExists[pop.id] = true;
                    });
                    populationStudyBidimensional[study.id] = populationMapExists;
                });
                if (typeof studiesPopFrequencies !== "undefined" && studiesPopFrequencies.length > 0) {
                    for (let j = 0; j < studiesPopFrequencies.length; j++) {
                        let study = studiesPopFrequencies[j];
                        for (let popFreqIdx in json[i].annotation.populationFrequencies) {
                            let popFreq = json[i].annotation.populationFrequencies[popFreqIdx];
                            if (UtilsNew.isNotUndefinedOrNull(popFreq)) {
                                let population = popFreq.population;
                                if (study.id === popFreq.study && populationStudyBidimensional[study.id][population] === true) {
                                    populationMap[study.id + "_" + population] = 'NA';
                                }
                            }
                        }
                    }
                }

                if (typeof json[i].annotation.populationFrequencies !== "undefined") {
                    for (let pf = 0; pf < json[i].annotation.populationFrequencies.length; pf++) {
                        let pop = json[i].annotation.populationFrequencies[pf].study + '_' + json[i].annotation.populationFrequencies[pf].population;
                        if (typeof populationMap[pop] !== "undefined" && populationMap[pop] == "NA") {
                            populationMap[pop] = Number(json[i].annotation.populationFrequencies[pf].altAlleleFreq).toFixed(4);
                        }
                    }
                }
                // pfArray = Object.keys(populationMap).map(key => populationMap[key]);

                // Clinvar, cosmic
                if (typeof json[i].annotation.variantTraitAssociation !== "undefined" && json[i].annotation.variantTraitAssociation != null) {
                    for (let key in json[i].annotation.variantTraitAssociation) {
                        let clinicalData = json[i].annotation.variantTraitAssociation[key];
                        if (typeof clinicalData !== "undefined") {
                            for (let cd = 0; cd < clinicalData.length; cd++) {
                                switch (key) {
                                    case "clinvar":
                                        clinvar.push(clinicalData[cd].traits[0]);
                                        break;
                                    case "cosmic":
                                        cosmic.push(clinicalData[cd].primaryHistology);
                                        break;
                                }
                            }
                        }
                    }
                }
            }
            if (genes.length > 0) {
                variantString.push(genes.join(','));
            } else {
                variantString.push("-");
            }
            variantString.push(json[i].type);
            if (ct.length > 0) {
                variantString.push(ct.join(','));
            } else {
                variantString.push("-");
            }
            variantString.push(sift);
            variantString.push(polyphen);
            variantString.push(cadd);
            variantString.push(phylop);
            variantString.push(phastCons);
            variantString.push(gerp);
            studiesPopFrequencies.forEach((study) => {
                study.populations.forEach(pop => variantString.push(populationMap[study.id + "_" + pop.id]));
            });
            // variantString.push(pfArray.join(','));
            if (clinvar.length > 0) {
                variantString.push(clinvar.join(','));
            } else {
                variantString.push("-");
            }
            if (cosmic.length > 0) {
                variantString.push(cosmic.join(','));
            } else {
                variantString.push("-");
            }

            dataString.push(variantString.join('\t'));
            variantString = [];
        }
        return dataString;
    }
}/*
 * Copyright 2015 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by imedina on 18/03/16.
 */

class CellBaseClientConfig {

    constructor(hosts = ["bioinfo.hpc.cam.ac.uk/cellbase", "www.ebi.ac.uk/cellbase"], version = "v3", species = "hsapiens") {
        this.setHosts(hosts);
        this.version = version;
        this.species = species;

        // default values
        this.rpc = "rest";

        this.cache = {
            active: false,
            database: `${this.species}_${this.version}_cellbase_cache`,
            subcategories: ["genomic_chromosome", "genomic_region", "genomic_variant", "feature_gene", "feature_variation",
                "feature_clinical", "feature_id", "feature_protein", "feature_transcript"]
        };
    }

    setHosts(hosts) {
        if (typeof hosts === "string") {
            this.hosts = hosts.split(",");
        } else {
            this.hosts = hosts;
        }
    }

}

class CellBaseClient {

    constructor(config) {
        if (typeof config === "undefined") {
            this._config = new CellBaseClientConfig();
        } else {
            this._config = config;
        }
        if (this._config.cache.active) {
            this.indexedDBCache = new IndexedDBCache(this._config.cache.database);
            this._initCache();
        }
    }

    _initCache() {
        this.indexedDBCache.createObjectStores(this._config.cache.subcategories);
    }

    setHosts(hosts) {
        if (typeof hosts !== "undefined") {
            this._config.setHosts(hosts);
        }
    }

    setVersion(version) {
        this._config.version = version;
    }


    /**
     * This method has been implemented to be backword compatible with old cellbase-manager.js
     */
    getOldWay(args) {
        return this.get(args.category, args.subcategory, args.id, args.resource, args.params, args.options);
    }

    getMeta(param, options) {
        if (options === undefined) {
            options = {};
        }
        let hosts = options.hosts || this._config.hosts;
        let version = options.version || this._config.version;
        let count = 0;
        // let response;
        let url = `http://${hosts[count]}/webservices/rest/${version}/` + "meta" + `/${param}`;
        // options.error = function() {
        //     if (++count < hosts.length) {
        //         // we need a new URL
        //         url = "http://" + hosts[count] + "/webservices/rest/" + version + "/" + "meta" + "/" + param;
        //         response = RestClient.call(url, options);
        //     } else {
        //         userError(this);
        //     }
        // };
        // response = RestClient.call(url, options);
        return RestClient.callPromise(url, options);
    }

    getFiles(folderId, resource, params, options) {
        if (options === undefined) {
            options = {};
        }
        let hosts = options.hosts || this._config.hosts;
        let version = options.version || this._config.version;
        let species = options.species || this._config.species;

        let url = `http://${hosts[count]}/webservices/rest/${version}/${species}/` + "files";

        if (typeof folderId !== "undefined" && folderId !== null && folderId !== "") {
            url += `/${folderId}/${resource}`;
        } else {
            url += `/${resource}`;
        }

        // We add the query params formatted in URL
        let queryParamsUrl = this._createSuffixKey(params, false);
        if (typeof queryParamsUrl !== "undefined" && queryParamsUrl !== null && queryParamsUrl !== "") {
            url += `?${queryParamsUrl}`;
        }
        return RestClient.callPromise(url, options);
    }

    getGeneClient(id, resource, params, options) {
        return this.get("feature", "gene", id, resource, params, options);
    }

    getTranscriptClient(id, resource, params, options) {
        return this.get("feature", "transcript", id, resource, params, options);
    }

    getProteinClient(id, resource, params, options) {
        return this.get("feature", "protein", id, resource, params, options);
    }

    getVariationClient(id, resource, params, options) {
        return this.get("feature", "variation", id, resource, params, options);
    }

    getRegulatoryClient(id, resource, params, options) {
        return this.get("feature", "regulatory", id, resource, params, options);
    }

    get(category, subcategory, ids, resource, params, options) {
        if (options === undefined) {
            options = {};
        }
        // we store the options from the parameter or from the default values in config
        let hosts = options.hosts || this._config.hosts;
        if (typeof hosts === "string") {
            hosts = hosts.split(",");
        }
        let rpc = options.rpc || this._config.rpc;
        let cache = options.cache || this._config.cache;


        let response;
        if (cache.active) {
            let os = `${category}_${subcategory}`;

            let nonCachedIds = [];

            let cacheKeys = [];
            let suffixKey = this._createSuffixKey(params, true);

            let idArray = [];
            if (ids !== undefined && ids !== null) {
                idArray = ids.split(",");
                for (let i = 0; i < idArray.length; i++) {
                    cacheKeys.push(`${idArray[i]}_${resource}${suffixKey}`);
                }
            } else {
                cacheKeys.push(resource + suffixKey);
            }

            console.time("Cache time:");
            let _this = this;
            response = new Promise(function(resolve, reject) {
                _this.indexedDBCache.getAll(os, cacheKeys, function (results) {
                    let uncachedQueries = false;
                    for (let i = 0; i < results.length; i++) {
                        if (results[i] === undefined) {
                            uncachedQueries = true;
                            if (idArray.length > 0) {
                                nonCachedIds.push(idArray[i]);
                            }
                        }
                    }

                    if (rpc.toLowerCase() === "rest") {
                        options.cacheFn = function(dataResponse) {
                            // we add the new fetched data to the cache
                            let suffixKey = _this._createSuffixKey(params, true);
                            // We make a copy of dataResponse
                            let query = {};
                            for (let i in dataResponse) {
                                query[i] = dataResponse[i];
                            }
                            // And remove the key response
                            delete query["response"];

                            if (idArray.length > 0) {
                                for (let i = 0; i < dataResponse.response.length; i++) {
                                    let result = {
                                        query: query,
                                        data: dataResponse.response[i]
                                    };
                                    // result['data'] = dataResponse.response[i];
                                    // // Update the data time to 0
                                    result.data.dbTime = 0;
                                    _this.indexedDBCache.add(os, `${idArray[i]}_${resource}${suffixKey}`, result);
                                }
                            } else {
                                for (let i = 0; i < dataResponse.response.length; i++) {
                                    let result = {
                                        query: query,
                                        data: dataResponse.response[i]
                                    };
                                    // Update the data time to 0
                                    result.data.dbTime = 0;
                                    _this.indexedDBCache.add(os, resource + suffixKey, result);
                                }
                            }

                            // debugger
                            // console.log(dataResponse);
                            // response = {response: []};
                            // let responses = [];
                            // for (let i = 0, j = 0; i < results.length; i++) {
                            //     if (results[i] == undefined) {
                            //         results[i] = dataResponse.response[j++].result;
                            //     }
                            //     responses.push({result: results[i]});
                            // }
                            // response.response = responses;
                            //
                            // console.log(response)
                            // // If the call is OK then we execute the success function from the user
                            // if (typeof options != "undefined" && typeof options.success === "function") {
                            //     options.success(response);
                            // }
                        };
                        if (uncachedQueries) {
                            // response = _this._callRestWebService(hosts, category, subcategory, nonCachedIds, resource, params, options);
                            resolve(_this._callRestWebService(hosts, category, subcategory, nonCachedIds, resource, params, options));
                        } else {
                            let queryResponse = results[0].query;
                            queryResponse["response"] = [];

                            // if (results.length > 1) {
                            //     debugger;
                            // }

                            for (let i = 0; i < results.length; i++) {
                                queryResponse.response.push(results[i].data);
                            }
                            // response.response = responses;
                            // response = Promise.resolve(queryResponse);
                            resolve(queryResponse);
                            // If the call is OK then we execute the success function from the user
                            if (typeof options !== "undefined" && typeof options.success === "function") {
                                options.success(response);
                            }
                        }
                    } else {
                        if (rpc.toLowerCase() === "grpc") {
                            response = _this._callGrpcService(hosts, category, subcategory, nonCachedIds, resource, params, options);
                        } else {
                            console.error(`No valid RPC method: ${rpc}. Accepted values are 'rest' and 'grpc'`);
                        }
                    }
                    console.timeEnd("Cache time:");
                });
            });
        } else {
            // let response;
            if (rpc.toLowerCase() === "rest") {
                response = this._callRestWebService(hosts, category, subcategory, ids, resource, params, options);
            } else {
                if (rpc.toLowerCase() === "grpc") {
                    response = this._callGrpcService(hosts, category, subcategory, ids, resource, params, options);
                } else {
                    console.error(`No valid RPC method: ${rpc}. Accepted values are 'rest' and 'grpc'`);
                }
            }
        }

        return response;
    }

    _callRestWebService(hosts, category, subcategory, ids, resource, params, options) {
        let version = options.version || this._config.version;
        let species = options.species || this._config.species;

        let count = 0;
        let response;
        let url = this._createRestUrl(hosts[count], version, species, category, subcategory, ids, resource, params);

        let userError = options.error;
        let _this = this;
        // if the URL query fails we try with next host
        options.error = function() {
            if (++count < hosts.length) {
                // we need a new URL
                url = _this._createRestUrl(hosts[count], version, species, category, subcategory, ids, resource, params);
                response = RestClient.call(url, options);
            } else {
                userError(this);
            }
        };

        // response = RestClient.call(url, options);
        response = RestClient.callPromise(url, options);
        return response;
    }


    _createRestUrl(host, version, species, category, subcategory, ids, resource, params) {
        let url;
        if (host.startsWith("https://")) {
            url = `${host}/webservices/rest/${version}/${species}/`;
        } else {
            url = `http://${host}/webservices/rest/${version}/${species}/`;
        }

        // Some web services do not need IDs
        if (typeof ids !== "undefined" && ids !== null && ids.length > 0) {
            url += `${category}/${subcategory}/${ids}/${resource}`;
        } else {
            url += `${category}/${subcategory}/${resource}`;
        }

        // We add the query params formatted in URL
        let queryParamsUrl = this._createSuffixKey(params, false);
        if (typeof queryParamsUrl !== "undefined" && queryParamsUrl != null && queryParamsUrl != "") {
            url += `?${queryParamsUrl}`;
        }
        return url;
    }

    _createSuffixKey(params, suffix) {
        // Do not remove the sort! we need to sort the array to ensure that the key of the cache will be correct
        let keyArray = _.keys(params).sort();
        let keyValueArray = [];
        for (let i in keyArray) {
            keyValueArray.push(`${keyArray[i]}=${encodeURIComponent(params[keyArray[i]])}`);
        }
        let suffixKey = keyValueArray.join("&");
        // suffixKey is preceded by '_' if suffix is true. Else it is treated as queryParam that needs to be sorted
        if (suffix && suffixKey !== "") {
            suffixKey = `_${suffixKey}`;
        }
        return suffixKey;
    }

    _callGrpcService(params) {
        console.warn("Not implemented yet, params: " + params)
    }

}
/*
 * Copyright 2016 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class OpenCGAClientConfig {

    constructor(host = "172.24.193.208:8080/opencga", version = "v1", useCookies = true, cookiePrefix = "catalog") {
        this.host = host;
        this.version = version;
        this.useCookies = useCookies;
        if (this.useCookies) {
            this.setPrefix(cookiePrefix);
        } else {
            this.userId = "";
            this.sessionId = "";
        }
        // default values
        this.rpc = "rest";
    }

    setPrefix(prefix) {
        this.cookieSessionId = `${prefix}_sid`;
        this.cookieUserId = `${prefix}_userId`;
        this.cookiePassword = `${prefix}_password`;
        this.cookieLoginResponse = `${prefix}_loginResponse`;
    }

}

class OpenCGAClient {

    constructor(config) {
        this._config = config;
    }

    getConfig() {
        return this._config;
    }

    setConfig(config) {
        this._config = config;
    }

    users() {
        if (typeof this._users === "undefined") {
            console.log(this._config);
            this._users = new Users(this._config);
        }
        return this._users;
    }

    projects() {
        if (typeof this._projects === "undefined") {
            this._projects = new Projects(this._config);
        }
        return this._projects;
    }

    studies() {
        if (typeof this._studies === "undefined") {
            this._studies = new Studies(this._config);
        }
        return this._studies;
    }

    files() {
        if (typeof this._files === "undefined") {
            this._files = new Files(this._config);
        }
        return this._files;
    }

    jobs() {
        if (typeof this._jobs === "undefined") {
            this._jobs = new Jobs(this._config);
        }
        return this._jobs;
    }

    samples() {
        if (typeof this._samples === "undefined") {
            this._samples = new Samples(this._config);
        }
        return this._samples;
    }

    individuals() {
        if (typeof this._individuals === "undefined") {
            this._individuals = new Individuals(this._config);
        }
        return this._individuals;
    }

    families() {
        if (typeof this._families === "undefined") {
            this._families = new Families(this._config);
        }
        return this._families;
    }

    cohorts() {
        if (typeof this._cohorts === "undefined") {
            this._cohorts = new Cohorts(this._config);
        }
        return this._cohorts;
    }

    panels() {
        if (typeof this._panels === "undefined") {
            this._panels = new Panels(this._config);
        }
        return this._panels;
    }

    clinical() {
        if (typeof this._clinical === "undefined") {
            this._clinical = new Clinical(this._config);
        }
        return this._clinical;
    }

    variables() {
        if (typeof this._variables === "undefined") {
            this._variables = new Variables(this._config);
        }
        return this._variables;
    }

    // Analysis
    alignments() {
        if (typeof this._alignments === "undefined") {
            this._alignments = new Alignment(this._config);
        }
        return this._alignments;
    }

    variants() {
        if (typeof this._variants === "undefined") {
            this._variants = new Variant(this._config);
        }
        return this._variants;
    }

    // GA4GH
    ga4gh() {
        if (typeof this._ga4gh === "undefined") {
            this._ga4gh = new Ga4gh(this._config);
        }
        return this._ga4gh;
    }

}

// parent class
class OpenCGAParentClass {

    constructor(config) {
        if (typeof config === "undefined") {
            this._config = new OpenCGAClientConfig();
        } else {
            this._config = config;
        }
    }

    post(category, ids, action, params, body, options) {
        return this.extendedPost(category, ids, null, null, action, params, body, options);
    }

    extendedPost(category1, ids1, category2, ids2, action, params, body, options) {
        let _options = options;
        if (typeof _options === "undefined") {
            _options = {};
        }
        _options.method = "POST";
        let _params = params;

        if (typeof _params === "undefined") {
            _params = {};
        }
        _params.body = body;
        return this.extendedGet(category1, ids1, category2, ids2, action, _params, _options);
    }

    get(category, ids, action, params, options) {
        return this.extendedGet(category, ids, null, null, action, params, options);
    }

    extendedGet(category1, ids1, category2, ids2, action, params, options) {
        // we store the options from the parameter or from the default values in config
        const host = this._config.host;
        const version = this._config.version;
        const rpc = this._config.rpc;
        let method = "GET";
        let _options = options;
        if (typeof _options === "undefined") {
            _options = {};
        }

        if (_options.hasOwnProperty("method")) {
            method = _options.method;
        }

        let _params = params;

        if (_params === undefined || _params === null || _params === "") {
            _params = {};
        }

        // Check that sessionId is being given
        if (!_params.hasOwnProperty("sid")) {
            const sid = this._getSessionId();
            if (typeof sid !== "undefined") {
                _options.sid = sid;
            }
        }

        // If category == users and userId is not given, we try to set it
        if (category1 === "users" && (ids1 === undefined || ids1 === null || ids1 === "")) {
            ids1 = this._getUserId();
        }

        if (rpc.toLowerCase() === "rest") {
            let url = this._createRestUrl(host, version, category1, ids1, category2, ids2, action);
            // if (method === "GET") {
            url = this._addQueryParams(url, _params);
            if (method === "POST") {
                _options.data = _params.body;
                if (action === "upload") {
                    _options["post-method"] = "form";
                }
            }
            // console.log(`OpenCGA client calling to ${url}`);
            // if the URL query fails we try with next host
            return RestClient.callPromise(url, _options);
        }
    }

    _createRestUrl(host, version, category1, ids1, category2, ids2, action) {
        let url;
        if (host.startsWith("https://")) {
            url = `${host}/webservices/rest/${version}/${category1}/`;
        } else {
            url = `http://${host}/webservices/rest/${version}/${category1}/`;
        }

        // Some web services do not need IDs
        if (typeof ids1 !== "undefined" && ids1 !== null) {
            url += `${ids1}/`;
        }

        // Some web services do not need a second category
        if (typeof category2 !== "undefined" && category2 !== null) {
            url += `${category2}/`;
        }

        // Some web services do not need the second category of ids
        if (typeof ids2 !== "undefined" && ids2 !== null) {
            url += `${ids2}/`;
        }

        url += action;

        return url;
    }

    _addQueryParams(url, params) {
        // We add the query params formatted in URL
        const queryParamsUrl = this._createQueryParam(params);
        let _url = url;
        if (typeof queryParamsUrl !== "undefined" && queryParamsUrl !== null && queryParamsUrl !== "") {
            _url += `?${queryParamsUrl}`;
        }
        return _url;
    }

    _createQueryParam(params) {
        // Do not remove the sort! we need to sort the array to ensure that the key of the cache will be correct
        let keyArray = _.keys(params);
        let keyValueArray = [];
        for (let i in keyArray) {
            // Whatever it is inside body will be sent hidden via POST
            if (keyArray[i] !== "body") {
                keyValueArray.push(`${keyArray[i]}=${encodeURIComponent(params[keyArray[i]])}`);
            }
        }
        return keyValueArray.join("&");
    }

    _getUserId() {
        if (this._config.hasOwnProperty("cookieUserId")) { // The app is using cookies
            return Cookies.get(this._config.cookieUserId);
        } else if (this._config.hasOwnProperty("userId")) {
            return this._config.userId;
        }
        return undefined;
    }

    _getSessionId() {
        if (this._config.hasOwnProperty("cookieSessionId")) { // The app is using cookies
            return Cookies.get(this._config.cookieSessionId);
        } else if (this._config.hasOwnProperty("sessionId")) {
            return this._config.sessionId;
        }
        return undefined;
    }

}

class Acls extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    getAcl(category, id, params) {
        return this.get(category, id, "acl", params);
    }

    updateAcl(category, members, params, body) {
        return this.extendedPost(category, null, "acl", members, "update", params, body);
    }

}

class Users extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    create(params, body) {
        return this.post("users", undefined, "create", params, body);
    }

    login(userId, password) {
        let params = {
            body: {
                password: password
            }
        };
        let options = {
            method: "POST"
        };
        // Encrypt password
        let encryptedPass = CryptoJS.SHA256(password).toString();

        if (this._config.useCookies) {
            let cookieSession = Cookies.get(this._config.cookieSessionId);
            let cookieUser = Cookies.get(this._config.cookieUserId);
            let cookiePass = Cookies.get(this._config.cookiePassword);
            let loginResponse = Cookies.get(this._config.cookieLoginResponse);

            if (cookieUser !== undefined && cookieUser === userId && cookiePass !== undefined && cookiePass === encryptedPass
                && cookieSession !== undefined && loginResponse !== undefined) {
                console.log("Credentials taken from cookies");
                return Promise.resolve(JSON.parse(loginResponse));
            }
        }
        return this.get("users", userId, "login", params, options).then(function(response) {
            if (response.error === "") {
                if (this._config.useCookies) {
                    // Cookies being used
                    Cookies.set(this._config.cookieSessionId, response.response[0].result[0].id);
                    Cookies.set(this._config.cookieUserId, userId);
                    Cookies.set(this._config.cookiePassword, encryptedPass);
                    Cookies.set(this._config.cookieLoginResponse, JSON.stringify(response));
                    console.log("Cookies properly set");
                }
                this._config.sessionId = response.response[0].result[0].id;
                this._config.userId = userId;

                return response;
            }
        }.bind(this));
    }

    // refresh only works if cookies are enabled
    refresh() {
        let userId = this._getUserId();

        return this.post("users", userId, "login", {}, {}).then(function(response) {
            if (response.error === "") {
                if (this._config.useCookies) {
                    // Cookies being used
                    Cookies.set(this._config.cookieSessionId, response.response[0].result[0].id);
                    Cookies.set(this._config.cookieUserId, userId);
                    Cookies.set(this._config.cookieLoginResponse, JSON.stringify(response));
                    console.log("Cookies properly set");
                }
                this._config.sessionId = response.response[0].result[0].id;
                this._config.userId = userId;

                return response;
            }
        }.bind(this));
    }

    logout() {
        if (this._config.hasOwnProperty("cookieUserId")) {
            // Cookies being used
            Cookies.expire(this._config.cookieSessionId);
            Cookies.expire(this._config.cookieUserId);
            Cookies.expire(this._config.cookiePassword);
            Cookies.expire(this._config.cookieLoginResponse);
            console.log("Cookies properly removed");
        }
        this._config.userId = "";
        this._config.sessionId = "";
        // return this.get("users", this._getUserId(), "logout")
        //     .then(function(response) {
        //         if (response.error === "") {
        //             if (this._config.hasOwnProperty("cookieUserId")) {
        //                 // Cookies being used
        //                 Cookies.expire(this._config.cookieSessionId);
        //                 Cookies.expire(this._config.cookieUserId);
        //                 Cookies.expire(this._config.cookiePassword);
        //                 Cookies.expire(this._config.cookieLoginResponse);
        //                 console.log("Cookies properly removed");
        //             }
        //             this._config.userId = "";
        //             this._config.sessionId = "";
        //             return response;
        //         }
        //     }.bind(this));
    }

    changeEmail(newMail) {
        let params = {
            nemail: newMail
        };
        return this.get("users", this._getUserId(), "change-email", params);
    }

    update(params, body, options) {
        return this.post("users", this._getUserId(), "update", params, body, options);
    }

    resetPassword() {
        return this.get("users", this._getUserId(), "reset-password");
    }

    info(params, options) {
        return this.get("users", this._getUserId(), "info", params, options);
    }

    getProjects(userId, params, options) {
        return this.get("users", userId, "projects", params, options);
    }

    remove(userId, params, options) {
        return this.get("users", userId, "delete", params, options);
    }

    // Filters
    getFilters(params, options) {
        return this.extendedGet("users", this._getUserId(), "configs/filters", undefined, "list", params, options);
    }

    getFilter(filter, params, options) {
        return this.extendedGet("users", this._getUserId(), "configs/filters", filter, "info", params, options);
    }

    createFilter(params, options) {
        let _params = Object.assign({}, params);
        let _options = Object.assign({}, options);

        if (!_params.hasOwnProperty("body")) {
            _params = {
                body: _params
            };
        }
        _options["method"] = "POST";
        return this.extendedGet("users", this._getUserId(), "configs/filters", undefined, "create", _params, _options);
    }

    updateFilter(filter, params, options) {
        let _params = Object.assign({}, params);
        let _options = Object.assign({}, options);

        if (!_params.hasOwnProperty("body")) {
            _params = {
                body: _params
            };
        }
        _options["method"] = "POST";
        return this.extendedGet("users", this._getUserId(), "configs/filters", filter, "update", _params, _options);
    }

    deleteFilter(filter) {
        return this.extendedGet("users", this._getUserId(), "configs/filters", filter, "delete", undefined, undefined);
    }

    // Configs
    getConfig(name, params, options) {
        return this.extendedGet("users", this._getUserId(), "configs", name, "info", params, options);
    }

    updateConfig(name, params, options) {
        let _params = Object.assign({}, params);
        let _options = Object.assign({}, options);

        if (!_params.hasOwnProperty("body")) {
            _params = {
                body: _params
            };
        }
        _params.name = name;
        _options.method = "POST";
        return this.extendedGet("users", this._getUserId(), "configs", undefined, "create", _params, _options);
    }

    deleteConfig(name) {
        return this.extendedGet("users", this._getUserId(), "configs", name, "delete", undefined, undefined);
    }

}

class Projects extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("projects", undefined, "create", params, body, options);
    }

    info(ids, params, options) {
        return this.get("projects", ids, "info", params, options);
    }

    search(params, options) {
        return this.get("projects", undefined, "search", params, options);
    }

    getStudies(id, params, options) {
        return this.get("projects", id, "studies", params, options);
    }

    update(ids, params, body, options) {
        return this.post("projects", ids, "update", params, body, options);
    }

    remove(ids, params, options) {
        return this.get("projects", ids, "delete", params, options);
    }

}

class Studies extends Acls {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("studies", undefined, "create", params, body, options);
    }

    remove(id, params, options) {
        return this.get("studies", id, "delete", params, options);
    }

    info(id, params, options) {
        return this.get("studies", id, "info", params, options);
    }

    summary(id, params, options) {
        return this.get("studies", id, "summary", params, options);
    }

    search(params, options) {
        return this.get("studies", undefined, "search", params, options);
    }

    getFiles(id, params, options) {
        return this.get("studies", id, "files", params, options);
    }

    getJobs(id, params, options) {
        return this.get("studies", id, "jobs", params, options);
    }

    getSamples(id, params, options) {
        return this.get("studies", id, "samples", params, options);
    }

    getGroups(id, params) {
        return this.get("studies", id, "groups", params);
    }

    createGroup(id, params, body, options) {
        return this.extendedPost("studies", id, "groups", undefined, "create", params, body, options);
    }

    deleteGroup(id, groupId) {
        return this.extendedGet("studies", id, "groups", groupId, "delete");
    }

    updateGroup(id, groupId, params, body, options) {
        return this.extendedPost("studies", id, "groups", groupId, "update", params, body, options);
    }

    update(id, params, body, options) {
        return this.post("studies", id, "update", params, body, options);
    }

    getVariants(id, params, options) {
        return this.get("studies", id, "variants", params, options);
    }

    getAlignments(id, params, options) {
        return this.get("studies", id, "alignments", params, options);
    }

}

class Files extends Acls {

    constructor(config) {
        super(config);
    }

    search(params, options) {
        return this.get("files", undefined, "search", params, options);
    }

    link(params, options) {
        return this.get("files", undefined, "link", params, options);
    }

    info(id, params, options) {
        return this.get("files", id, "info", params, options);
    }

    groupBy(params, options) {
        return this.get("files", undefined, "groupBy", params, options);
    }

    treeView(id, params, options) {
        return this.get("files", id, "tree-view", params, options);
    }

    refresh(id, params, options) {
        return this.get("files", id, "refresh", params, options);
    }

    download(id, params, options) {
        return this.get("files", id, "download", params, options);
    }

    content(id, params, options) {
        return this.get("files", id, "content", params, options);
    }

    grep(id, params, options) {
        return this.get("files", id, "grep", params, options);
    }

    getAllBioFormats(params, options) {
        return this.get("files", undefined, "bioformats", params, options);
    }

    getAllFormats(params, options) {
        return this.get("files", undefined, "formats", params, options);
    }

    create(params, body, options) {
        return this.post("files", undefined, "create", params, body, options);
    }

    list(folderId, params, options) {
        return this.get("files", folderId, "list", params, options);
    }

    index(id, params, options) {
        return this.get("files", id, "index", params, options);
    }

    getAlignments(id, params, options) {
        return this.get("files", id, "alignments", params, options);
    }

    getVariants(id, params, options) {
        return this.get("files", id, "variants", params, options);
    }

    remove(id, params, options) {
        return this.get("files", id, "delete", params, options);
    }

    update(id, params, body, options) {
        return this.post("files", id, "update", params, body, options);
    }

    relink(id, params, options) {
        return this.get("files", id, "relink", params, options);
    }

    upload(params, options) {
        return this.post("files", undefined, "upload", undefined, params, options);
    }

}

class Jobs extends Acls {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("jobs", undefined, "create", params, body, options);
    }

    visit(id, params, options) {
        return this.get("jobs", id, "visit", params, options);
    }

    groupBy(params, options) {
        return this.get("jobs", undefined, "groupBy", params, options);
    }

    info(id, params, options) {
        return this.get("jobs", id, "info", params, options);
    }

    remove(id, params, options) {
        return this.get("jobs", id, "delete", params, options);
    }

    search(params, options) {
        return this.get("jobs", undefined, "search", params, options);
    }

}

class Individuals extends Acls {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("individuals", undefined, "create", params, body, options);
    }

    search(params, options) {
        return this.get("individuals", undefined, "search", params, options);
    }

    info(id, params, options) {
        return this.get("individuals", id, "info", params, options);
    }

    update(id, params, body, options) {
        return this.post("individuals", id, "update", params, body, options);
    }

    remove(id, params, options) {
        return this.get("individuals", id, "delete", params, options);
    }

    annotationsetsCreate(id, params, body, options) {
        return this.post("individuals", id, "annotationsets/create", params, body, options);
    }

    annotationsetsUpdate(id, name, params, body, options) {
        return this.extendedPost("individuals", id, "annotationsets", name, "update", params, body, options);
    }

}

class Families extends Acls {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("families", undefined, "create", params, body, options);
    }

    search(params, options) {
        return this.get("families", undefined, "search", params, options);
    }

    info(id, params, options) {
        return this.get("families", id, "info", params, options);
    }

    update(id, params, body, options) {
        return this.post("families", id, "update", params, body, options);
    }

    annotationsetsCreate(id, params, body, options) {
        return this.post("families", id, "annotationsets/create", params, body, options);
    }

    annotationsetsUpdate(id, name, params, body, options) {
        return this.extendedPost("families", id, "annotationsets", name, "update", params, body, options);
    }

}

class Samples extends Acls {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("samples", undefined, "create", params, body, options);
    }

    search(params, options) {
        return this.get("samples", undefined, "search", params, options);
    }

    groupBy(params, options) {
        return this.get("samples", undefined, "groupBy", params, options);
    }

    load(params, options) {
        return this.get("samples", undefined, "load", params, options);
    }

    info(id, params, options) {
        return this.get("samples", id, "info", params, options);
    }

    update(id, params, body, options) {
        return this.post("samples", id, "update", params, body, options);
    }

    remove(id, params, options) {
        return this.get("samples", id, "delete", params, options);
    }

    annotationsetsCreate(id, params, body, options) {
        return this.post("samples", id, "annotationsets/create", params, body, options);
    }

    annotationsetsUpdate(id, name, params, body, options) {
        return this.extendedPost("samples", id, "annotationsets", name, "update", params, body, options);
    }

}

class Variables extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("variableset", undefined, "create", params, body, options);
    }

    search(params, options) {
        return this.get("variableset", undefined, "search", params, options);
    }

    info(id, params, options) {
        return this.get("variableset", id, "info", params, options);
    }

    summary(id) {
        return this.get("variableset", id, "summary", {}, {});
    }

    update(id, params, body, options) {
        return this.post("variableset", id, "update", params, body, options);
    }

    remove(id, params, options) {
        return this.get("variableset", id, "delete", params, options);
    }

}

class Cohorts extends Acls {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("cohorts", undefined, "create", params, body, options);
    }

    stats(id, params, options) {
        return this.get("cohorts", id, "stats", params, options);
    }

    search(params, options) {
        return this.get("cohorts", undefined, "search", params, options);
    }

    info(id, params, options) {
        return this.get("cohorts", id, "info", params, options);
    }

    getSamples(id, params) {
        return this.get("cohorts", id, "samples", params);
    }

    update(id, params, body, options) {
        return this.post("cohorts", id, "update", params, body, options);
    }

    remove(id, params, options) {
        return this.get("cohorts", id, "delete", params, options);
    }

    annotationsetsCreate(id, params, body, options) {
        return this.post("cohorts", id, "annotationsets/create", params, body, options);
    }

    annotationsetsUpdate(id, name, params, body, options) {
        return this.extendedPost("cohorts", id, "annotationsets", name, "update", params, body, options);
    }

}

class Panels extends Acls {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("panels", undefined, "create", params, body, options);
    }

    info(id, params, options) {
        return this.get("panels", id, "info", params, options);
    }

}

class Clinical extends Acls {

    constructor(config) {
        super(config);
    }

    create(params, body, options) {
        return this.post("clinical", undefined, "create", params, body, options);
    }

    update(id, params, body, options) {
        return this.post("clinical", id, "update", params, body, options);
    }

    info(id, params, options) {
        return this.get("clinical", id, "info", params, options);
    }

    search(params, options) {
        return this.get("clinical", undefined, "search", params, options);
    }

}

class Alignment extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    query(id, params, options) {
        if (params === undefined) {
            params = {};
        }
        params["file"] = id;
        return this.get("analysis/alignment", undefined, "query", params, options);
    }

    stats(id, params, options) {
        if (params === undefined) {
            params = {};
        }
        params["file"] = id;
        return this.get("analysis/alignment", undefined, "stats", params, options);
    }

    coverage(id, params, options) {
        let _params = params;
        if (_params === undefined) {
            _params = {};
        }
        _params.file = id;
        return this.get("analysis/alignment", undefined, "coverage", _params, options);
    }

}

class Variant extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    query(params, options) {
        return this.get("analysis/variant", undefined, "query", params, options);
    }

    facet(params, options) {
        return this.get("analysis/variant", undefined, "facet", params, options);
    }

    index(params, options) {
        return this.get("analysis/variant", undefined, "index", params, options);
    }

}

class Ga4gh extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    beacon(params, options) {
        return this.get("ga4gh", undefined, "responses", params, options);
    }

}

class RestClient {

    static call(url, options) {
        let method = options.method || "GET";
        let async = options.async;

        let dataResponse = null;
        console.time("AJAX call to CellBase");
        let request = new XMLHttpRequest();
        request.onload = function(event) {
            console.log(`CellBaseClient: call to URL succeed: '${url}'`);
            let contentType = this.getResponseHeader("Content-Type");
            if (contentType === "application/json") {
                dataResponse = JSON.parse(this.response);

                if (typeof options !== "undefined" && typeof options.cacheFn === "function") {
                    options.cacheFn(dataResponse);
                }

                // If the call is OK then we execute the success function from the user
                // console.log(options)
                if (typeof options !== "undefined" && typeof options.success === "function" && typeof options.cacheFn === "undefined") {
                    options.success(dataResponse);
                }
                console.timeEnd("AJAX call to CellBase");
                console.log(options, `Size: ${event.total} Bytes`);
            } else {
                console.log(this.response);
            }
        };

        request.onerror = function(event) {
            // console.log(event)
            console.error(`CellBaseClient: an error occurred when calling to '${url}'`);
            if (typeof options.error === "function") {
                options.error(this);
            }
        };

        request.ontimeout = function(event) {
            console.error(`CellBaseClient: a timeout occurred when calling to '${url}'`);
            if (typeof options.error === "function") {
                options.error(this);
            }
        };

        request.open(method, url, async);
        if (typeof options !== "undefined" && options.hasOwnProperty("sid")) {
            request.setRequestHeader("Authorization", `Bearer ${options["sid"]}`);
        }
        // request.timeout = options.timeout || 0;
        request.send();
        return dataResponse;
    }

    static callPromise(url, options) {
        let method = "GET";
        let async = true;
        if (typeof options !== "undefined") {
            method = options.method || "GET";
            async = options.async;
        }

        let dataResponse = null;
        console.time(`REST call to ${url}`);

        // Creating the promise
        return new Promise(function(resolve, reject) {
            let request = new XMLHttpRequest();

            request.onload = function(event) {
                if (request.status === 200) {
                    let contentType = this.getResponseHeader("Content-Type");
                    // indexOf() is used because sometimes the contentType is 'application/json;charset=utf-8'
                    if (contentType.indexOf("application/json")!= -1) {
                        dataResponse = JSON.parse(this.response);

                        if (typeof options !== "undefined" && typeof options.cacheFn === "function") {
                            options.cacheFn(dataResponse);
                        }

                        // If the call is OK then we execute the success function from the user
                        if (typeof options !== "undefined" && typeof options.success === "function"
                            && typeof options.cacheFn === "undefined") {
                            options.success(dataResponse);
                        }
                        console.timeEnd(`REST call to ${url}`);
                        resolve(dataResponse);
                    } else if (contentType.startsWith("text/plain")) {
                        resolve(this.response);

                    } else {
                        console.log(`Result is not JSON: ${this.response}`);
                    }
                } else {
                    console.error(`REST call to URL failed: '${url}'`);
                    reject(JSON.parse(request.response));
                }
            };

            request.onerror = function(event) {
                console.error(`CellBaseClient: an error occurred when calling to '${url}'`);
                if (typeof options.error === "function") {
                    options.error(this);
                }
                reject(Error(`CellBaseClient: an error occurred when calling to '${url}'`));
            };

            request.ontimeout = function(event) {
                console.error(`CellBaseClient: a timeout occurred when calling to '${url}'`);
                if (typeof options.error === "function") {
                    options.error(this);
                }
            };

            request.open(method, url, async);
            if (typeof options !== "undefined" && options.hasOwnProperty("sid")) {
                request.setRequestHeader("Authorization", `Bearer ${options["sid"]}`);
            }

            // request.timeout = options.timeout || 0;
            if (method === "POST" && options !== undefined && options.hasOwnProperty("data")) {
                if (options.hasOwnProperty("post-method") && options["post-method"] === "form") {
                    let myForm = new FormData();
                    let keys = Object.keys(options.data);

                    for (let i in keys) {
                        myForm.append(keys[i], options.data[keys[i]]);
                    }

                    request.send(myForm);
                } else {
                    // request.setRequestHeader("Access-Control-Allow-Origin", "*");
                    // // request.setRequestHeader("Access-Control-Allow-Credentials", "true");
                    // request.setRequestHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                    request.setRequestHeader("Content-type", "application/json");
                    request.send(JSON.stringify(options.data));
                }
            } else {
                request.send();
            }
        });
    }

}
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

function DataSource() {
	
};

DataSource.prototype.fetch = function(){

};
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

FileDataSource.prototype.fetch = DataSource.prototype.fetch;

function FileDataSource(args) {
    DataSource.prototype.constructor.call(this);

    _.extend(this, Backbone.Events);

    this.file;
    this.maxSize = 500 * 1024 * 1024;
    this.type = 'text';

    //set instantiation args, must be last
    _.extend(this, args);
};

FileDataSource.prototype.error = function () {
    alert("File is too big. Max file size is " + this.maxSize + " bytes");
};

FileDataSource.prototype.fetch = function (async) {
    var _this = this;
    if (this.file.size <= this.maxSize) {
        if (async) {
            var reader = new FileReader();
            reader.onload = function (evt) {
                _this.trigger('success', evt.target.result);
            };
            return this.readAs(this.type, reader);
        } else {
            // FileReaderSync web workers only
            var reader = new FileReaderSync();
            return this.readAs(this.type, reader);
        }
    } else {
        _this.error();
        _this.trigger('error', {sender: this});
    }
};


FileDataSource.prototype.readAs = function (type, reader) {
    switch (type) {
        case 'binary':
            return reader.readAsBinaryString(this.file);
            break;
        case 'text':
        default:
            return reader.readAsText(this.file, "UTF-8");
    }
};/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

StringDataSource.prototype.fetch = DataSource.prototype.fetch;

function StringDataSource(str) {
	DataSource.prototype.constructor.call(this);

    _.extend(this, Backbone.Events);
	this.str = str;
};

StringDataSource.prototype.fetch = function(async){
	if(async){
		this.trigger('success',this.str);
	}else{
		return this.str;
	}
};
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

function TabularDataAdapter(dataSource, args){
	var _this = this;
	
	this.dataSource = dataSource;
	this.async = true;

	if (args != null){
		if(args.async != null){
			this.async = args.async;
		}
	}
	
	this.fileLines = [];
	
	if(this.async){
		this.dataSource.success.addEventListener(function(sender,data){
			_this.parse(data);
			_this.onLoad.notify();
		});
		this.dataSource.fetch(this.async);
	}else{
		var data = this.dataSource.fetch(this.async);
		this.parse(data);
	}
	
	this.onLoad = new Event();	
};

TabularDataAdapter.prototype.getLines = function(){
	return this.fileLines;
};

TabularDataAdapter.prototype.parse = function(data){
	var _this = this;
	var lines = data.split("\n");
//	console.log("creating objects");
	for (var i = 0; i < lines.length; i++){
		var line = lines[i].replace(/^\s+|\s+$/g,"");
		line = line.replace(/\//gi,"");//TODO DONE   /  is not allowed in the call
		if ((line != null)&&(line.length > 0) && line.charAt(0)!="#"){
			var fields = line.split("\t");
			this.fileLines.push(fields);
		}
	}
};

//
TabularDataAdapter.prototype.getLinesCount = function(){
	return this.fileLines.length;
};

TabularDataAdapter.prototype.getValuesByColumnIndex = function(columnIndex){
	var result = new Array();
	for (var i = 0; i < this.getLinesCount(); i++) {
		if (this.getLines()[i][columnIndex] != null){
			result.push(this.getLines()[i][columnIndex]);
		}
	}
	return result;
};

/** Returns: 'numeric' || 'string **/
TabularDataAdapter.prototype.getHeuristicTypeByColumnIndex = function(columnIndex){
	return this.getHeuristicTypeByValues(this.getValuesByColumnIndex(columnIndex));
};

TabularDataAdapter.prototype.getHeuristicTypeByValues = function(values){
	var regExp = /^[-+]?[0-9]*\.?[0-9]+$/;
	for (var i = 0; i < values.length; i++) {
		if(!regExp.test(new String(values[i]).replace(",", "."))){
			return 'string';
		}
	}
	return 'numeric';
};/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

UrlDataSource.prototype.fetch = DataSource.prototype.fetch;

function UrlDataSource(url, args) {
	DataSource.prototype.constructor.call(this);
	
	this.url = url;
	this.proxy = CELLBASE_HOST+"/latest/utils/proxy?url=";
	if(args != null){
		if(args.proxy != null){
			if(typeof(args.proxy) == "boolean"){
				if(args.proxy == false){
					this.proxy = false;
				}
				else{
					this.url = this.proxy + url;
				}
			}else if(typeof(args.proxy) == "string"){
				this.url = args.proxy + url;
			}
		}
	}
	this.success = new Event();
	this.error = new Event();
};

UrlDataSource.prototype.fetch = function(async){
	var _this = this;
	
	var datos = null;
	
	if(this.url){
		$.ajax({
			type : "GET",
			url : this.url,
			async : async,
			success : function(data, textStatus, jqXHR) {
				if(async){
					_this.success.notify(data);
				}else{
					datos = data;
				}
			},
			error : function(jqXHR, textStatus, errorThrown){
				console.log("URL Data source: Ajax call returned : "+errorThrown+'\t'+textStatus+'\t'+jqXHR.statusText+" END");
				_this.error.notify();
			}
		});
		
		return datos;
	}
};
/*
 * Copyright 2015-2016 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by imedina on 10/02/17.
 */

class Lollipop {

    constructor(settings) {
        this.settings = settings;
    }

    createSvg(protein, variants, settings) {

        // If no settings is provided we use the one passed in the constructor
        if (typeof settings === "undefined" || settings === null) {
            settings = this.settings;
        }

        // We merge user's setting with default settings, by doing this users do not have to write al possible settings
        settings = Object.assign(this._getDefaultSetting(), settings);
        if (typeof settings.length === "undefined") {
            settings.length = protein.sequence.length;
        }

        let ratio = settings.width / settings.length;
        let svgWidth = settings.length * ratio;
        let svgHeight = settings.height;
        settings.ratio = ratio;

        let svg = SVG.create('svg', {
            width: svgWidth + (40 * ratio),
            height: svgHeight,
            viewBox: "0 0 " + (svgWidth + 40 * ratio) + " " + svgHeight,
            style: "fill: white"
        });
        // SVG.addChild(svg, 'rect', {width: svgWidth, height: svgHeight, style: "fill: white;stroke: black"});
        SVG.addChild(svg, 'rect', {width: svgWidth + (40 * ratio), height: svgHeight, style: "fill: white;stroke: black"});

        let center = (svgHeight - 20) / 2;
        SVG.addChild(svg, 'rect', {
            x: 20 * ratio,
            y: center + 5,
            rx: 2 * ratio,
            ry: 2,
            width: svgWidth,
            height: 15,
            style: "fill: lightgrey"
        });

        // Lollipop
        let variantPositions = new Set();
        let verticalOffset = 0;
        let gVariants = SVG.create('g', {});
        for (let i = 0; i < variants.length; i++) {
            for (let j = 0; j < variants[i].annotation.consequenceTypes.length; j++) {

                if (variants[i].annotation.consequenceTypes[j].biotype == "protein_coding"
                    // && variants[i].annotation.consequenceTypes[j].geneName == this.gene
                    && typeof variants[i].annotation.consequenceTypes[j].proteinVariantAnnotation != "undefined") {

                    let proteinVariantAnnotation = variants[i].annotation.consequenceTypes[j].proteinVariantAnnotation;
                    for (let z = -(settings.proteinPositioningInterval); z <= settings.proteinPositioningInterval; z++) {
                        if (variantPositions.has(proteinVariantAnnotation.position + z)) {
                            verticalOffset = -15;
                            break;
                        }
                    }
                    SVG.addChild(gVariants, 'line', {
                        x1: (20 + proteinVariantAnnotation.position) * ratio,
                        y1: center - 20 + verticalOffset,
                        x2: (20 + proteinVariantAnnotation.position) * ratio,
                        y2: center + 5,
                        width: svgWidth, height: 25, style: "stroke: grey;stroke-width: 2"
                    });

                    let stats = variants[i].studies[0].stats["ALL"];
                    let variant = SVG.addChild(gVariants, 'circle', {
                        cx: (20 + proteinVariantAnnotation.position) * ratio,
                        cy: center - 20 - 5 + verticalOffset,
                        r: 5 + stats.altAlleleFreq * (8 - 5),
//                                style: "fill: red"});
                        style: "fill: " + settings.color[variants[i].annotation.consequenceTypes[j].sequenceOntologyTerms[0].name]
                    });

                    $(variant).qtip({
                        content: {
                            title: variants[i].id,
                            text: this._getMutationTooltip(variants[i], variants[i].annotation.consequenceTypes[j])
                        },
                        position: {viewport: $(window), target: "mouse", adjust: {x: 25, y: 15}},
                        style: {width: true, classes: ' ui-tooltip ui-tooltip-shadow'},
                        show: {delay: 250},
                        hide: {delay: 200}
                    });
                    variantPositions.add(proteinVariantAnnotation.position);
                    verticalOffset = 0;
                }
            }
        }
        svg.appendChild(gVariants);

        // Features
        let gFeatures = SVG.create('g', {});
        for (let i = 0; i < protein.feature.length; i++) {
            if (typeof protein.feature[i].ref != "undefined" && typeof protein.feature[i].location.end !== "undefined") {
                if (protein.feature[i].ref.indexOf("PF") == 0) {
                    let width = protein.feature[i].location.end.position - protein.feature[i].location.begin.position;
                    let rect = SVG.addChild(gFeatures, 'rect', {
                        x: (20 + protein.feature[i].location.begin.position) * ratio,
                        y: center,
                        rx: 5 * ratio,
                        ry: 5,
                        width: width * ratio,
                        height: 25,
                        style: "fill: #00DD00"
                    });

                    let text = SVG.addChild(gFeatures, 'text', {
                        x: (20 + protein.feature[i].location.begin.position + 5) * ratio,
                        y: center + 15,
                        style: "fill: white;font-size=4px;font-weight:10"
                    });
                    text.textContent = protein.feature[i].description.substring(0, 10);

                    $(rect).qtip({
                        content: {text: protein.feature[i].description, title: protein.feature[i].ref},
                        position: {viewport: $(window), target: "mouse", adjust: {x: 25, y: 15}},
                        style: {width: true, classes: ' ui-tooltip ui-tooltip-shadow'},
                        show: {delay: 250},
                        hide: {delay: 200}
                    });

                }
            }
        }
        svg.appendChild(gFeatures);

        let ruleSVG = this._createSvgRuleBar(settings.length, settings);
        svg.appendChild(ruleSVG);

        return svg;
    }

    _createSvgRuleBar(length, settings) {
        Object.assign(settings, {
            height: 20,
            startX: 20,
            startY: 90,
        });

        let g = SVG.create('g', {});

        let line = SVG.addChild(g, 'line', {
            x1: settings.startX * settings.ratio,
            y1: settings.startY,
            x2: (settings.startX + length) * settings.ratio,
            y2: settings.startY,
            style: "stroke: grey"
        });

        // Render small ticks
        for (let i = 0; i < length; i += 10) {
            SVG.addChild(g, 'line', {
                x1: (settings.startX + i) * settings.ratio,
                y1: settings.startY,
                x2: (settings.startX + i) * settings.ratio,
                y2: settings.startY + 5,
                style: "stroke: grey"
            });
        }

        // Render big ticks
        for (let i = 0; i <= length; i += 50) {
            SVG.addChild(g, 'line', {
                x1: (settings.startX + i) * settings.ratio,
                y1: settings.startY,
                x2: (settings.startX + i) * settings.ratio,
                y2: settings.startY + 10,
                style: "stroke: grey"
            });
            let text = SVG.addChild(g, 'text', {
                x: (settings.startX + i - 8) * settings.ratio,
                y: settings.startY + 25,
                style: "fill: black;font-size=4px;font-weight:10"
            });
            text.textContent = i;
        }

        // Render last tick
        SVG.addChild(g, 'line', {
            x1: (settings.startX + length) * settings.ratio,
            y1: settings.startY,
            x2: (settings.startX + length) * settings.ratio,
            y2: settings.startY + 10,
            style: "stroke: grey"
        });
        let text = SVG.addChild(g, 'text', {
            x: (settings.startX + length - 8) * settings.ratio,
            y: settings.startY + 25,
            style: "fill: black;font-size=4px;font-weight:10"
        });
        text.textContent = length;

        return g;
    }

    _getDefaultSetting() {
        let config = {
            width: 1500,
            height: 140,
            proteinPositioningInterval: 3
        };
        return config;
    }

    _getMutationTooltip(variant, consequenceType) {
        let mutation = "-";
        let codon = consequenceType.codon || '-';
        let score = [];
        let cadd = "-";
        let conservation = [];
        if (typeof consequenceType.proteinVariantAnnotation !== "undefined") {
            let proteinVariantAnnotation = consequenceType.proteinVariantAnnotation;
            mutation = proteinVariantAnnotation.reference + "/" + proteinVariantAnnotation.alternate;
            if (typeof proteinVariantAnnotation.substitutionScores !== "undefined" && proteinVariantAnnotation.substitutionScores.length > 0) {
                for (let i = 0; i < proteinVariantAnnotation.substitutionScores.length; i++) {
                    score.push("<b>" + proteinVariantAnnotation.substitutionScores[i].source.charAt(0).toUpperCase()
                        + proteinVariantAnnotation.substitutionScores[i].source.slice(1) + "</b>: " + proteinVariantAnnotation.substitutionScores[0].score);
                }
            }
        }
        if (typeof variant.annotation !== "undefined") {
            if (typeof variant.annotation.functionalScore !== "undefined") {
                for (let i = 0; i < variant.annotation.functionalScore.length; i++) {
                    if (variant.annotation.functionalScore[i].source == "cadd_scaled") {
                        cadd = Number(variant.annotation.functionalScore[i].score).toFixed(2);
                        break;
                    }
                }
            }

            if (typeof variant.annotation.conservation !== "undefined") {
                for (let j = 0; j < variant.annotation.conservation.length; j++) {
                    conservation.push("<b>" + variant.annotation.conservation[j].source.charAt(0).toUpperCase()
                        + variant.annotation.conservation[j].source.slice(1) + "</b>: " + Number(variant.annotation.conservation[j].score).toFixed(3));
                }
            }
        }

        let tooltip = "<b>ID</b>: " + variant.id + "<br>"
            + "<b>Mutation</b>: " + mutation + "<br>"
            + "<b>Codon</b>: " + codon + "<br>";
        if (score.length > 0) {
            tooltip += score.join("<br>") + "<br>";
        }
        tooltip += "<b>CADD</b>: " + cadd + "<br>";
        if (conservation.length > 0) {
            tooltip += conservation.join("<br>");
        }
        return tooltip;
    }
}/*
 * Copyright 2015-2016 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by imedina on 16/05/17.
 */
class Pedigree {

    constructor(pedigree, settings) {
        this.pedigree = pedigree;
        this.settings = settings;
    }

    isDuo() {
        return (typeof this.pedigree.father !== "undefined" || typeof this.pedigree.mother !== "undefined")
            && typeof this.pedigree.children !== "undefined" && this.pedigree.children.length === 1;
    }

    isTrio() {
        return typeof this.pedigree.father !== "undefined" && typeof this.pedigree.mother !== "undefined"
            && typeof this.pedigree.children !== "undefined" && this.pedigree.children.length === 1;
    }

    isFamily() {
        return typeof this.pedigree.father !== "undefined" && typeof this.pedigree.mother !== "undefined"
            && typeof this.pedigree.children !== "undefined" && this.pedigree.children.length > 1;
    }

    render(settings) {
        return this._render(this.pedigree, settings);
    }

    static renderFromPed(pedigree, settings) {
        return this._render(pedigree, settings);
    }

    _render(ped, settings) {
        // If no settings is provided we use the one passed in the constructor
        if (typeof settings === "undefined" || settings === null) {
            settings = this.settings;
        }

        // We merge user's setting with default settings, by doing this users do not have to write al possible settings
        settings = Object.assign(this.getDefaultSetting(), settings, this.settings);

        let pedigree = this._preprocessFamily(ped);

        let svg = SVG.create("svg", {
            width: settings.width,
            height: settings.height,
            viewBox: "0 0 " + settings.width + " " + settings.height,
            style: "fill: white",
            xmlns: "http://www.w3.org/2000/svg"
        });

        if (settings.border) {
            SVG.addChild(svg, "rect", {width: settings.width, height: settings.height, style: "fill: white;stroke: black"});
        }

        svg.appendChild(this._createSvgDefs(pedigree, settings));

        let xCenter = settings.width / 2;
        let radius = settings.box / 2;

        // Draw the lines between parents and children
        if (typeof pedigree.father !== "undefined" || typeof pedigree.mother !== "undefined") {
            let verticalBarOffset = 0;
            if (typeof pedigree.father !== "undefined" && typeof pedigree.mother !== "undefined" &&
                ( pedigree.father.partnerConsaguinity || pedigree.mother.partnerConsaguinity)) {
                verticalBarOffset = 2;
                SVG.addChild(svg, "line", {
                    x1: xCenter - settings.box,     y1: 10 + radius - verticalBarOffset,
                    x2: xCenter + settings.box,     y2: 10 + radius - verticalBarOffset,
                    style: "stroke: black;stroke-width: 2"
                });
                SVG.addChild(svg, "line", {
                    x1: xCenter - settings.box,     y1: 10 + radius + verticalBarOffset,
                    x2: xCenter + settings.box,     y2: 10 + radius + verticalBarOffset,
                    style: "stroke: black;stroke-width: 2"
                });

            } else {
                SVG.addChild(svg, "line", {
                    x1: xCenter - settings.box,     y1: 10 + radius,
                    x2: xCenter + settings.box,     y2: 10 + radius,
                    style: "stroke: black;stroke-width: 2"
                });
            }

            // Vertical bar for children
            SVG.addChild(svg, "line", {
                x1: xCenter,    y1: 10 + radius + verticalBarOffset,
                x2: xCenter,    y2: 10 + radius + (1.5 * settings.box),
                style: "stroke: black;stroke-width: 2"
            });
        }

        // Draw the FATHER
        if (typeof pedigree.father !== "undefined") {
            // pedigree.father.sex = "male";
            this._addFamilyMember(pedigree.father, xCenter - 1.5 * settings.box, 10, settings.box, radius, settings.selectShowSampleNames, svg);
        }

        // Draw the MOTHER
        if (typeof pedigree.mother !== "undefined") {
            // pedigree.mother.sex = "female";
            this._addFamilyMember(pedigree.mother, xCenter + 1.5 * settings.box, 10, settings.box, radius, settings.selectShowSampleNames, svg);
        }

        // Draw the CHILDREN
        if (typeof pedigree.children !== "undefined" && pedigree.children.length > 0) {
            if (pedigree.children.length === 1) {
                this._addFamilyMember(pedigree.children[0], xCenter, 2 * settings.box + 10, settings.box, radius, settings.selectShowSampleNames, svg);
            } else {
                let numChildren = pedigree.children.length;
                let w =  (numChildren + numChildren - 1) * settings.box;
                // Add horizontal bar
                SVG.addChild(svg, "line", {
                    x1: xCenter - w / 2,        y1: 10 + radius + (1.5 * settings.box),
                    x2: xCenter + w / 2 ,       y2: 10 + radius + (1.5 * settings.box),
                    style: "stroke: black;stroke-width: 2"
                });

                let left = xCenter - w / 2;
                let interval = w / (numChildren - 1);
                for (let i = 0; i < pedigree.children.length; i++) {
                    SVG.addChild(svg, "line", {
                        x1: left + (i * interval),        y1: 10 + radius + (1.5 * settings.box),
                        x2: left + (i * interval) ,       y2: 10 + radius + (1.5 * settings.box) + 15,
                        style: "stroke: black;stroke-width: 2"
                    });
                    this._addFamilyMember(pedigree.children[i], left + (i * interval), (1.5 * settings.box) + 15 + 10 + radius, settings.box, radius, settings.selectShowSampleNames, svg);
                }
            }
        }

        return svg;
    }

    _addFamilyMember(object, x, y, width, radius, showSampleNames, svg) {
        // No defined sex
        let memberSVG;
        if (typeof object.sex === "undefined" || object.sex === "undefined") {
            SVG.addChild(svg, "rect", {
                x: x - radius,          y: y,
                width: width * 0.8,     height: width * 0.8,
                transform: "translate(" + radius + ") rotate(45 " + (x - radius) + " " + (10 + radius + (1.5 * width) + y) + ")",
                style: "fill: " + object.colorPattern + ";stroke: black;stroke-width: 2"
            });
        } else {
            // Member is a male
            if (object.sex === "male" || object.sex === "MALE") {
                SVG.addChild(svg, "rect", {
                    x: x - radius,      y: y,
                    width: width,       height: width,
                    // fill: "url(#Pattern2)",
                    style: "fill: url(#" + object.colorPattern + ");stroke: black;stroke-width: 2"
                });
            } else {
                // Member is a female
                memberSVG = SVG.addChild(svg, "circle", {
                    cx: x,              cy: y + radius,
                    r: radius,
                    style: "fill: url(#" + object.colorPattern + ");stroke: black;stroke-width: 2"
                });
            }
        }

        if ((typeof object.lifeStatus !== 'undefined' && object.lifeStatus !== null) && object.lifeStatus.toUpperCase() === "DECEASED") {
            SVG.addChild(svg, "line", {
                x1: x - radius - 10,      y1: y + radius + 30,
                x2: x + radius + 10,      y2: y - radius + 10,
                style: "stroke: black;stroke-width: 2"
            });
        }

        if (showSampleNames) {
            let text = SVG.addChild(svg, "text", {
                x: x - radius + 2,  y: y + width + 15,
                style: "fill: black;font-size=8px;font-weight:10"
            });
            text.textContent = object.name;
        }

        // $(memberSVG).qtip({
        //     content: {text: "3:1000123:A:T: " + "<span style='font-weight: bold'>0/1</span>", title: object.member.name},
        //     position: {target: "mouse", adjust: {x: 25, y: 15}, effect: false},
        //     // position: {viewport: $(window), target: "mouse", adjust: {x: 25, y: 15}},
        //     style: {width: true, classes: "ui-tooltip ui-tooltip-shadow"},
        //     show: {delay: 300},
        //     hide: {delay: 300}
        // });
    }

    _preprocessFamily(fam) {
        // Create, edit and return a deep copy of the user object, this prevents us of modifying user's object
        let family = JSON.parse(JSON.stringify(fam));

        let map = {};
        for (let m of family.members) {
            map[m.name] = m;
        }

        let colorMap = {};
        for (let idx in family.phenotypes) {
            colorMap[family.phenotypes[idx].id] = idx;
        }

        family.children = [];
        for (let m of family.members) {
            if (m.father !== undefined || m.mother !== undefined ) {
                if (m.father !== undefined) {

                    map[m.father].partner = m.mother;
                    map[m.father].partnerConsaguinity = m.parentalConsanguinity;
                }

                if(m.mother !== undefined) {
                    map[m.mother].partner = m.father;
                    map[m.mother].partnerConsaguinity = m.parentalConsanguinity;
                }

                if (m.father !== undefined && this._isOrphan(map[m.father])) {
                    family.father = map[m.father];
                }

                if(m.mother!== undefined && this._isOrphan(map[m.mother])){
                    family.mother = map[m.mother];
                }

                family.children.push(m);
            }

            // We save the corresponding disease color pattern for each sample
            if (m.phenotypes !== undefined && m.phenotypes.length > 0) {
                let colorIdx = [];
                for (let c of m.phenotypes) {
                    colorIdx.push(colorMap[c]);
                }
                // Pattern suffix IDs must be sorted, eg. Pattern_01
                colorIdx = colorIdx.sort();
                m.colorPattern = "Pattern_" + colorIdx.join("");
            } else {
                m.colorPattern = "PatternWhite";
            }
        }

        return family;
    }

    // This function create the different color Patterns in a SVG 'defs' section
    _createSvgDefs(family, settings) {
        let svgDefs = SVG.create("defs");

        // Default color pattern when no disease exist
        let pattern = SVG.create("pattern", {id: "PatternWhite", x: 0, y: 0, width: 1, height: 1});
        let rect = SVG.create("rect", {
            x: 0,                   y: 0,
            width: settings.box,    height: settings.box,
            fill: "white"});
        pattern.appendChild(rect);
        svgDefs.appendChild(pattern);

        // We create all possible combination (incrementally with no reptition, eg. 0, 01, 02, 1, 12, ...)
        for (let i = 0; i < family.phenotypes.length; i++) {
            // Add the single disease color, eg. 0, 1, 2
            let pattern = SVG.create("pattern", {id: "Pattern_" + i, x: 0, y: 0, width: 1, height: 1});
            let rect = SVG.create("rect", {
                x: 0,                   y: 0,
                width: settings.box,    height: settings.box,
                fill: settings.colors[i]});
            pattern.appendChild(rect);
            svgDefs.appendChild(pattern);

            // Add the double disease color, eg. 01, 02, 12, ...
            for (let j = i + 1; j < family.phenotypes.length; j++) {
                let pattern = SVG.create("pattern", {id: "Pattern_" + i + j, x: 0, y: 0, width: 1, height: 1});
                let rect1 = SVG.create("rect", {
                    x: 0,                       y: 0,
                    width: settings.box / 2,    height: settings.box,
                    fill: settings.colors[i]});
                let rect2 = SVG.create("rect", {
                    x: settings.box / 2,        y: 0,
                    width: settings.box / 2,    height: settings.box,
                    fill: settings.colors[j]});
                pattern.appendChild(rect1);
                pattern.appendChild(rect2);
                svgDefs.appendChild(pattern);
            }
        }

        return svgDefs;
    }

    _isOrphan(member) {
        return (member.father === undefined || member.father=== null) && (member.mother === undefined || member.mother.id === null)
    }

    getDefaultSetting() {
        return {
            width: 400,
            height: 240,
            box: 40,
            colors: ["black", "red", "blue"]
        };
    }

    parseFamilyToPedigree(family){
        let newMembers = family.members.map((member) => {
            let newMember = {};
            newMember.name = member.name;

            if(typeof member.phenotypes !== "undefined" && member.phenotypes.length > 0) {
                newMember.phenotypes = member.phenotypes.map((disease) => {return disease.id});
            }
            if(UtilsNew.isNotUndefinedOrNull(member.father) && UtilsNew.isUndefinedOrNull(member.father.id)) {

                newMember.father = member.father;
            }
            if(UtilsNew.isNotUndefinedOrNull(member.mother) && UtilsNew.isUndefinedOrNull(member.mother.id)) {
                newMember.mother = member.mother;
            }
            newMember.sex = member.sex;
            newMember.lifeStatus = member.lifeStatus;
            newMember.parentalConsanguinity = member.parentalConsanguinity;

            return newMember;
        });
        let pedigreFromFamily = {
            name: family.name,
            phenotypes: family.phenotypes,
            members: newMembers,
        };

        this.pedigree = pedigreFromFamily;
    }

    pedigreeFromFamily(family, settings = null){
        this.parseFamilyToPedigree(family);
        return this.render(settings);
    }

}

class FeatureAdapter {

    constructor(options) {
        this.options = options;
        // this.handlers = handlers;

        // if (!this.options.hasOwnProperty("chunkSize")) {
        //     this.options.chunkSize = 10000;
        // }
        //
        // // Extend backbone events
        // Object.assign(this, Backbone.Events);
        // // _.extend(this, args);
        // this.on(this.handlers);
    }

    _checkRegion(region) {
        // Check region is a valid object
        if (region === undefined || region === null) {
            return undefined;
        }

        // Check start is >= 1
        region.start = Math.max(region.start, 1);

        // Check end >= start
        if (region.start > region.end) {
            console.warn("Swapping start and end positions: ", region);
            [region.start, region.end] = [region.end, region.start];
        }

        return region;
    }

    // This function must be implemented by any child
    getData() {

    }

}/*
 * Copyright (c) 2016 Pedro Furio (Genomics England)
 * Copyright (c) 2016 Ignacio Medina (University of Cambridge)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

class CellBaseAdapter extends FeatureAdapter {

    constructor (client, category, subcategory, resource, params = {}, options = {}, handlers = {}) {
        super();

        this.client = client;
        this.category = category;
        this.subCategory = subcategory;
        this.resource = resource;
        this.params = params;
        this.options = options;
        this.handlers = handlers;

        if (!this.options.hasOwnProperty("chunkSize")) {
            this.options.chunkSize = 50000;
        }

        // Extend backbone events
        Object.assign(this, Backbone.Events);

        this.on(this.handlers);
    }

    setSpecies (species) {
        this.species = species;
    }

    setClient (client) {
        this.client = client;
    }

    getData (args) {
        let _this = this;

        let params = {};
        //histogram: (dataType == 'histogram')
        Object.assign(params, this.params);
        Object.assign(params, args.params);

        /** 1 region check **/
        let region = args.region;
        if (region.start > 300000000 || region.end < 1) {
            return;
        }
        region.start = (region.start < 1) ? 1 : region.start;
        region.end = (region.end > 300000000) ? 300000000 : region.end;

        /** 2 category check **/
        // var categories = [this.category + this.subCategory + this.resource + Utils.queryString(params)];

        /** 3 dataType check **/
        let dataType = args.dataType;
        if (_.isUndefined(dataType)) {
            console.log("dataType must be provided!!!");
        }

        /** 4 chunkSize check **/
        let chunkSize = this.options.chunkSize; // this.cache.defaultChunkSize should be the same

        /** 5 client check **/
        if (_.isUndefined(this.client)) {
            console.log("cellbase client must be provided!!!");
        }

        return new Promise(function(resolve, reject) {
            // Create the chunks to be retrieved
            let start = _this._getStartChunkPosition(region.start);
            let regions = [];
            do {
                regions.push(`${region.chromosome}:${start}-${start + _this.options.chunkSize - 1}`);
                start += _this.options.chunkSize;
            } while(start <= region.end);

            _this.client.get(_this.category, _this.subCategory, regions.join(","), _this.resource, params)
                .then(function (response) {
                    let responseChunks = _this._cellbaseSuccess(response, dataType, chunkSize);
                    resolve({items: responseChunks, dataType: dataType, chunkSize: chunkSize, sender: _this});
                })
                .catch(function () {
                    reject("Server error");
                });
        });
    }

    _getStartChunkPosition (position) {
        return Math.floor(position / this.options.chunkSize) * this.options.chunkSize;
    }

    _cellbaseSuccess (data, dataType, chunkSize) {
        //let timeId = `${Utils.randomString(4) + this.resource} save`;
        //console.time(timeId);
        /** time log **/

        let regions = [];
        let chunks = [];
        for (let i = 0; i < data.response.length; i++) {    // TODO test what do several responses mean
            let queryResult = data.response[i];
            if (dataType == "histogram") {
                for (let j = 0; j < queryResult.result.length; j++) {
                    let interval = queryResult.result[j];
                    let region = new Region(interval);
                    regions.push(region);
                    chunks.push(interval);
                }
            } else {
                regions.push(new Region(queryResult.id));
                chunks.push(queryResult.result);
            }
        }

        let items = [];
        for (let i = 0; i < regions.length; i++) {
            let chunkStartId = Math.floor(regions[i].start / this.options.chunkSize);
            items.push({
                chunkKey: `${regions[i].chromosome}:${chunkStartId}_${dataType}_${chunkSize}`,
                region: regions[i],
                value: chunks[i]
            });
        }
        /** time log **/
        //console.timeEnd(timeId);
        return items;
    }
}
/*
 * Copyright (c) 2016 Pedro Furio (Genomics England)
 * Copyright (c) 2016 Asunción Gallego (CIPF)
 * Copyright (c) 2016 Ignacio Medina (University of Cambridge)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Created by pfurio on 16/11/16.
 */

class OpencgaAdapter extends FeatureAdapter {

    constructor(client, category, subcategory, resource, params = {}, options = {}, handlers = {}) {
        super();

        this.client = client;
        this.category = category;
        this.subCategory = subcategory;
        this.resource = resource;
        this.params = params;
        this.options = options;
        this.handlers = handlers;

        const CHUNK_SIZE_DEFAULT = 2000;

        if (typeof this.options.chunkSize === "undefined" || this.options.chunkSize === 0) {
            this.options.chunkSize = CHUNK_SIZE_DEFAULT;
        }

        Object.assign(this, Backbone.Events);
        this.on(this.handlers);
    }
    // Deprecated method
    setSpecies(species) {
            // this.species = species;
    }

    getData(args){
        switch(this.category) {
            case "analysis/variant":
                return this._getVariant(args);
                break;
            case "analysis/alignment":
                return this._getAlignmentData(args);
                break;
            default:
                return this._getExpressionData(args);
        }
    }

    _getExpressionData(args){
        //TODO check with expression data
        console.log("In GetExpressionData");
        let _this = this;
        let params = {};

        Object.assign(params, this.params, args.params);

        /** 4 chunkSize check **/
        let chunkSize = params.interval ? params.interval : this.options.chunkSize; // this.cache.defaultChunkSize should be the same
        if (this.debug) {
            console.log(chunkSize);
        }

        return new Promise(function(resolve, reject) {
            // Create the chunks to be retrieved
            let start = _this._getStartChunkPosition(region.start);
            let end = _this._getStartChunkPosition(region.end);

            let regions = [];
            let myRegion = start;
            args.webServiceCallCount = 0;

            do {
                regions.push(`${region.chromosome}:${myRegion}-${myRegion + _this.options.chunkSize - 1}`);
                myRegion += _this.options.chunkSize;
            } while(myRegion < end);

            let groupedRegions = _this._groupQueries(regions);
            let chunks = [];
            for (let i = 0; i < groupedRegions.length; i++) {
                args.webServiceCallCount++;
                _this.client.get(_this.category, _this.subCategory, groupedRegions[i], _this.resource, params)
                    .then(function (response) {
                        let responseChunks = _this._generalOpencgaSuccess(response, dataType, chunkSize);
                        args.webServiceCallCount--;

                        chunks = chunks.concat(responseChunks);
                        if (args.webServiceCallCount === 0) {
                            chunks.sort(function (a, b) {
                                return a.chunkKey.localeCompare(b.chunkKey);
                            });
                            resolve({items: chunks, dataType: dataType, chunkSize: chunkSize, sender: _this});
                        }
                    })
                    .catch(function () {
                        reject("Server error");
                    });
            }
        });
    }

    _getVariant(args){
        console.log("OpenCGA Data Adapter: fetching Variants");

        let params = {};
        Object.assign(params, this.params, args.params);

        /** 1 region check **/
        let region = args.region;
        region = super._checkRegion(region);

        /** 2 dataType check **/
        let dataType = args.dataType;
        if (_.isUndefined(dataType)) {
            console.error("dataType must be provided!!!");
            return;
        }

        /** 3 chunkSize check **/
        let chunkSize = params.interval ? params.interval : this.options.chunkSize; // this.cache.defaultChunkSize should be the same
        if (this.debug) {
            console.log(chunkSize);
        }

        /** 4 studies check **/
        let studies = params.studies;
        if (studies === undefined) {
            return;
        }

        /** 5 exclude check **/
        if (params.exclude === 'undefined') {
            params.exclude = "studies.files,studies.stats,annotation";// For sample-genotype mode less exclusive than browse mode
        }
        /** 6 check type data **/
        if (UtilsNew.isNotUndefinedOrNull(params.returnedSamples)){   //When there are samples not display histogram
            dataType = "features";
            params["histogram"]= "undefined";
            params["histogramLogarithm"] = "undefined";
            params["histogramMax"]= "undefined";
        }

        let _this = this;
        return new Promise(function(resolve, reject) {
            // Create the chunks to be retrieved
            let start = _this._getStartChunkPosition(region.start);
            let regions = [];
            do {
                regions.push(`${region.chromosome}:${start}-${start + _this.options.chunkSize - 1}`);
                start += _this.options.chunkSize;
            } while (start <= region.end);

            let p = {};
            for (let param of Object.keys(params)) {
                if (typeof params[param] !== "undefined") {
                    p[param] = params[param];
                }
            }
            let chuncksByRegion =[];

                // The query is similar to:
                // _this.client.variants().query({
                //     region: groupedRegions[i],
                //     studies: studies,
                //     //exclude: "studies, annotation"
                //     //exclude: "studies.files,studies.stats,annotation"
                // })

            for (let i = 0; i < regions.length; i++) {
                p["region"] = regions[i];
                chuncksByRegion[i] =_this.client.variants().query(p)
                    .then(function (response) {
                        return _this._variantsuccess(response, dataType, regions[i], chunkSize);
                    })
                    .catch(function (reason) {
                        reject("Server error, getting variants: " + reason);
                    });
            }

            Promise.all(chuncksByRegion).then(function (response) {
                resolve({
                    items: response, dataType: dataType, chunkSize: chunkSize, sender: _this
                });

            });


        });

    }

    _getAlignmentData(args) {
        let _this = this;
        let params = {};
//                    histogram: (dataType == 'histogram')
        Object.assign(params, this.params);
        Object.assign(params, args.params);

        /** 1 region check **/
        let region = args.region;
        if (region.start > 300000000 || region.end < 1) {
            return;
        }
        region.start = (region.start < 1) ? 1 : region.start;
        region.end = (region.end > 300000000) ? 300000000 : region.end;


        /** 2 category check **/
        let categories = this.resource.toString().split(',');   // in this adapter each category is each file

        /** 3 dataType check **/
        let dataType = args.dataType;
        if (_.isUndefined(dataType)) {
            console.log("dataType must be provided!!!");
        }

        /** 4 chunkSize check **/
        let chunkSize = params.interval ? params.interval : this.options.chunkSize; // this.cache.defaultChunkSize should be the same
        if (this.debug) {
            console.log(chunkSize);
        }

        /** 5 file check **/
        let fileId = params.fileId;
        if (fileId === undefined) {
            return;
        }

        let study = params.study;

        // Create the chunks to be retrieved
        let start = this._getStartChunkPosition(region.start);

        let regions = [];
        args.webServiceCallCount = 0;

        do {
            regions.push(`chr${region.chromosome}:${start}-${start + this.options.chunkSize - 1}`);
            start += this.options.chunkSize;
        } while(start < region.end);

        let groupedRegions = this._groupQueries(regions);
        args.regions = groupedRegions;

        return new Promise(function(resolve, reject) {
            if (dataType === "features") {
                let chunks = [];
                for (let i = 0; i < groupedRegions.length; i++) {
                    args.webServiceCallCount++;

                    let alignments = _this.client.alignments().query(fileId,
                        {
                            region: groupedRegions[i],
                            study: study
                        })
                        .then(function (response) {
                            return _this._opencgaSuccess(response, categories, dataType, chunkSize, args);
                        });


                    let coverage = _this.client.alignments().coverage(fileId,
                        {
                            region: groupedRegions[i],
                            study: study
                        })
                        .then(function (response) {
                            let aux = _this._opencgaSuccess(response, categories, dataType, chunkSize, args);
                            // We fix a little the object
                            for (let i = 0; i < aux.length; i++) {
                                aux[i].windowSize = aux[i].value[0].windowSize;
                                aux[i].value = aux[i].value[0].values;
                            }
                            return aux;
                        });

                    Promise.all([alignments, coverage]).then(function (response) {
                        args.webServiceCallCount--;
                        let auxArray = [];
                        // The array of alignments and coverage should be the same size
                        for (let i = 0; i < response[0].length; i++) {
                            if (response[0][i].chunkKey === response[1][i].chunkKey) {
                                let auxObject = {
                                    region: response[0][i].region,
                                    chunkKey: response[0][i].chunkKey,
                                    alignments: response[0][i].value,
                                    coverage: {
                                        windowSize: response[1][i].windowSize,
                                        value: response[1][i].value
                                    }
                                };
                                auxArray.push(auxObject);
                            } else {
                                console.log("Unexpected behaviour when retrieving alignments and coverage. Something went wrong.");
                                console.log("Alignment chunk key: " + response[0][i].chunkKey + ". Coverage chunk key: "
                                    + response[1][i].chunkKey);
                                reject("Unexpected behaviour when retrieving alignments and coverage. Something went wrong.");
                            }
                        }
                        chunks = chunks.concat(auxArray);

                        if (args.webServiceCallCount === 0) {
                            resolve({
                                items: chunks, dataType: dataType, chunkSize: chunkSize, sender: _this
                            });
                        }
                    })
                        .catch(function(response){
                            reject("Server alignments error");
                        });
                }
            } else { // histogram

                let chunks = [];
                for (let i = 0; i < groupedRegions.length; i++) {
                    args.webServiceCallCount++;

                    let coverage = _this.client.alignments().coverage(fileId,
                        {
                            region: groupedRegions[i],
                            study: study,
                            //windowSize: Math.round((region.end - region.start) / 500)
                        })
                        .then(function (response) {
                            let aux = _this._opencgaSuccess(response, categories, dataType, chunkSize, args);
                            let auxArray = [];
                            // Create object for renderer
                            for (let i = 0; i < aux.length; i++) {
                                let auxObject = {
                                    region: aux[i].region,
                                    chunkKey: aux[i].chunkKey,
                                    alignments: [],
                                    coverage: {
                                        windowSize: aux[i].value[0].windowSize,
                                        value: aux[i].value[0].values
                                    }
                                };
                                auxArray.push(auxObject);

                            }
                            args.webServiceCallCount--;

                            chunks = chunks.concat(auxArray);

                            if (args.webServiceCallCount === 0) {
                                resolve({
                                    items: chunks, dataType: dataType, chunkSize: chunkSize, sender: _this
                                });
                            }
                        });

                }
            }
        });
    }

    _generalOpencgaSuccess (data, dataType, chunkSize) {
        let timeId = `${Utils.randomString(4) + this.resource} save`;
        console.time(timeId);
        /** time log **/

        let regions = [];
        let chunks = [];
        for (let i = 0; i < data.response.length; i++) {    // TODO test what do several responses mean
            let queryResult = data.response[i];
            if (dataType == "histogram") {
                for (let j = 0; j < queryResult.result.length; j++) {
                    let interval = queryResult.result[j];
                    let region = new Region(interval);
                    regions.push(region);
                    chunks.push(interval);
                }
            } else {
                regions.push(new Region(queryResult.id));
                chunks.push(queryResult.result);
            }
        }

        let items = [];
        for (let i = 0; i < regions.length; i++) {
            let chunkStartId = Math.floor(regions[i].start / this.options.chunkSize);
            items.push({
                chunkKey: `${regions[i].chromosome}:${chunkStartId}_${dataType}_${chunkSize}`,
                // chunkKey: this._getChunkKey(regions[i].chromosome, chunkStartId),
                region: regions[i],
                value: chunks[i]
            });
        }

        /** time log **/
        console.timeEnd(timeId);

        return items;
    }

    _opencgaSuccess(data, categories, dataType, chunkSize, args) {
        let timeId = Utils.randomString(4) + this.resource + " save";
        console.time(timeId);
        /** time log **/
        let responseItems = [];
        for (let i = 0; i < data.response.length; i++) {
            responseItems.push({
                chunkKey: data.response[i].id,
                region: new Region(data.response[i].id),
                value: data.response[i].result
            });
        }
        console.log(data);
        /** time log **/
        console.timeEnd(timeId);

        return responseItems;
    }

    _variantsuccess(response, dataType, queryRegion, chunkSize) {

        //console.time(timeId);
        /** time log **/

        let regions = [];
        let chunks = [];
        if (dataType !== 'histogram') {
            for(let i = 0; i< response.response.length; i++){
                let res = response.response[i].result;
                chunks.push(res);

            }
            //console.log("Chunks:", chunks);
            let regionSplit = queryRegion.split(',');
            for (let i = 0; i < regionSplit.length; i++) {
                let regionStr = regionSplit[i];
                regions.push(new Region(regionStr));
            }

            let chunkStartId = Math.floor(regions[0].start / chunkSize);
            //need return a object
            return  {
                chunkKey: `${regions[0].chromosome}:${chunkStartId}_${dataType}_${chunkSize}`,
                region: regions[0],
                value: response.response[0].result,
                dataType: dataType
            };

        } else {
            let queryResult;
            if (typeof this.parseHistogram === 'function') {
                queryResult = this.parseHistogram(response);
            } else {
                queryResult = response.response[0];
            }

            for (let j = 0; j < queryResult.result.length; j++) {
                let interval = queryResult.result[j];
                let region = new Region(interval);
                regions.push(region);
                chunks.push(interval);
            }

            let items = [];
            for (let i = 0; i < regions.length; i++) {
                let chunkStartId = Math.floor(regions[i].start / this.options.chunkSize);
                items.push({
                    chunkKey: `${regions[i].chromosome}:${chunkStartId}_${dataType}_${chunkSize}`,
                    region: regions[i],
                    value: chunks[i]
                });
            }
            return items;
        }
    }

    _getStartChunkPosition (position) {
        return Math.floor(position / this.options.chunkSize) * this.options.chunkSize;
    }

    /**
     * Transform the list on a list of lists, to limit the queries
     * [ r1,r2,r3,r4,r5,r6,r7,r8 ]
     * [ [r1,r2,r3,r4], [r5,r6,r7,r8] ]
     */
    _groupQueries(uncachedRegions) {
        let groupSize = 50;
        let queriesLists = [];
        while (uncachedRegions.length > 0) {
            queriesLists.push(uncachedRegions.splice(0, groupSize).toString());
        }
        return queriesLists;
    }

}/**
 * ** Generic adapter to any uri

 new FeatureTemplateAdapter({
    uriTemplate: 'http://host/webserver/{customVar}/{species}/{region}',
    templateVariables: {
        customVar: 'info',
    },
    species: genomeViewer.species,
    parse: function (response) {
        var itemsArray = [];
        for (var i = 0; i < response.response.length; i++) {
            var r = response.response[i];
            itemsArray.push(r.result);
        }
        return itemsArray;
    }
 })

 * ** templateVariables is used for custom variables in the uri. region and species will be ignored
 * ** as will be configured automatically

 * ** The species config is the current species should not appear in templateVariables
 * ** The region in the uriTemplate is provided by the track so should not appear in templateVariables
 * ** The parse function is used to adapt de features from the response

 */

class FeatureTemplateAdapter {
    constructor(args){
        Object.assign(this, Backbone.Events);

        this.templateVariables = {};
        this.multiRegions = true;
        this.histogramMultiRegions = true;
        this.chromosomeSizes;

        Object.assign(this, args);

        this.configureCache();

        this.debug = false;
    }

    setSpecies(species) {
        this.species = species;
        this.configureCache();
    }

    setHost(host) {
        this.configureCache();
        this.host = host;
    }

    deleteCache(){
        this.cache.delete();
    }

    configureCache() {
        let speciesString = '';
        if (this.species != null) {
            let speciesString = this.species.id + this.species.assembly.name.replace(/[/_().\ -]/g, '');
        }
        let cacheId = this.uriTemplate + speciesString;
        if (!this.cacheConfig) {
            this.cacheConfig = {
                //    //subCacheId: this.resource + this.params.keys(),
                chunkSize: 3000
            }
        }
        this.cacheConfig.cacheId = cacheId;
        this.cache = new FeatureChunkCache(this.cacheConfig);
    }

    getData (args) {
        let _this = this;

        let params = {};
        //histogram: (dataType == 'histogram')
        _.extend(params, this.params);
        _.extend(params, args.params);

        /** 1 region check **/
        let region = args.region;
        let limitedRegion = this._computeLimitedRegion(region.chromosome);
        if (region.start > limitedRegion || region.end < 1) {
            return;
        }
        region.start = (region.start < 1) ? 1 : region.start;
        region.end = (region.end > limitedRegion) ? limitedRegion : region.end;

        /** 2 category check **/
        let categories = ["cat_" + Utils.queryString(this.templateVariables) + Utils.queryString(params)];

        /** 3 dataType check **/
        let dataType = args.dataType;
        if (_.isUndefined(dataType)) {
            console.log("dataType must be provided!!!");
        }

        /** 4 chunkSize check **/
        let chunkSize = params.interval ? params.interval : this.cacheConfig.chunkSize; // this.cache.defaultChunkSize should be the same
        if (this.debug) {
            console.log(chunkSize);
        }

        /**
         * Get the uncached regions (uncachedRegions) and cached chunks (cachedChunks).
         * Uncached regions will be used to query cellbase. The response data will be converted in chunks
         * by the Cache TODO????
         * Cached chunks will be returned by the args.dataReady Callback.
         */
        return new Promise(function(resolve, reject) {
            _this.cache.get(region, categories, dataType, chunkSize, function (cachedChunks, uncachedRegions) {

                let category = categories[0];
                let categoriesName = "";
                for (let j = 0; j < categories.length; j++) {
                    categoriesName += "," + categories[j];
                }
                categoriesName = categoriesName.slice(1); // to remove first ','

                let chunks = cachedChunks[category];
                // TODO check how to manage multiple regions

                let queriesList;
                if (dataType !== 'histogram') {
                    if (_this.multiRegions === false) {
                        queriesList = _this._singleQueries(uncachedRegions[category]);
                    } else {
                        queriesList = _this._groupQueries(uncachedRegions[category]);
                    }
                } else {
                    if (_this.histogramMultiRegions === false) {
                        queriesList = _this._singleQueries(uncachedRegions[category]);
                    } else {
                        queriesList = _this._groupQueries(uncachedRegions[category]);
                    }
                }

                /** Uncached regions found **/
                if (queriesList.length > 0) {
                    args.webServiceCallCount = 0;
                    for (let i = 0; i < queriesList.length; i++) {
                        args.webServiceCallCount++;
                        let queryRegion = queriesList[i];

                        let request = new XMLHttpRequest();

                        /** Temporal fix save queried region **/
                        request._queryRegion = queryRegion;
                        request._originalRegion = region;

                        request.onload = function () {
                            args.webServiceCallCount--;
                            if (request.status !== 400 && request.status !== 500) {
                                let response;
                                try {
                                    response = JSON.parse(this.response);
                                } catch (e) {
                                    console.log('Warning: Response is not JSON');
                                    response = this.response;
                                }

                                /** Process response **/
                                let responseChunks = _this._success(response, categories, dataType, this._queryRegion, this._originalRegion, chunkSize);
                                chunks = chunks.concat(responseChunks);
                            } else {
                                console.log("request.status: " + request.status);
                            }
                            if (args.webServiceCallCount === 0) {
                                chunks.sort(function (a, b) {
                                    return a.chunkKey.localeCompare(b.chunkKey)
                                });
                                resolve({
                                    items: chunks,
                                    dataType: dataType,
                                    chunkSize: chunkSize,
                                    sender: _this
                                });
                            }
                        };
                        request.onerror = function () {
                            console.log('Server error');
                            reject();
                        };
                        let uriTemplate = new URITemplate(_this.uriTemplate);
                        _this.templateVariables['region'] = queryRegion.toString();
                        _this.templateVariables['species'] = _this._getSpeciesQueryString(_this.species);

                        let url = uriTemplate.expand(_this.templateVariables);
                        url = Utils.addQueryParamtersToUrl(params, url);
                        request.open('GET', url, true);
                        console.log(url);
                        request.send();

                    }
                } else
                /** All regions are cached **/
                {
                    resolve({
                        items: chunks,
                        dataType: dataType,
                        chunkSize: chunkSize,
                        sender: _this
                    });
                }
            });
        });
    }

    _success (response, categories, dataType, queryRegion, originalRegion, chunkSize) {
        //let timeId = Utils.randomString(4) + this.resource + " save";
        //console.time(timeId);
        /** time log **/

        let regions = [];
        let chunks = [];
        if (dataType !== 'histogram') {
            if (typeof this.parse === 'function') {
                chunks = this.parse(response, dataType);
            } else {
                chunks = response;
            }
            regions = this._getRegionsFromQueryRegions(queryRegion);
        } else {
            if (typeof this.parseHistogram === 'function') {
                chunks = this.parseHistogram(response);
            } else {
                chunks = response;
            }
            regions = this._getRegionsFromHistogramChunks(chunks, originalRegion.chromosome);
        }

        let items = this.cache.putByRegions(regions, chunks, categories, dataType, chunkSize);

        /** time log **/
        //console.timeEnd(timeId);

        return items;
    }

    /**
     * Transform the list on a list of lists, to limit the queries
     * [ r1,r2,r3,r4,r5,r6,r7,r8 ]
     * [ [r1,r2,r3,r4], [r5,r6,r7,r8] ]
     */
    _groupQueries(uncachedRegions) {
        // modify region end to chromosome length.
        for (let i = 0; i < uncachedRegions.length; i++) {
            let r = uncachedRegions[i];
            this._computeRegionSize(r);
        }

        let groupSize = 50;
        let queriesLists = [];
        while (uncachedRegions.length > 0) {
            queriesLists.push(uncachedRegions.splice(0, groupSize).toString());
        }
        return queriesLists;
    }

    _singleQueries(uncachedRegions) {
        // modify region end to chromosome length.
        for (let i = 0; i < uncachedRegions.length; i++) {
            let r = uncachedRegions[i];
            this._computeRegionSize(r);
        }

        let queriesLists = [];
        for (let i = 0; i < uncachedRegions.length; i++) {
            let region = uncachedRegions[i];
            queriesLists.push(region.toString());
        }
        return queriesLists;
    }

    _getSpeciesQueryString(species) {
        if (species == null) {
            return '';
        }
        if (this.speciesParse != null) {
            return this.speciesParse(species);
        } else {
            return Utils.getSpeciesCode(species.scientificName)
        }
    }

    _getRegionsFromQueryRegions(queryRegion) {
        let regions = [];
        let regionSplit = queryRegion.split(',');
        for (let i = 0; i < regionSplit.length; i++) {
            let regionStr = regionSplit[i];
            regions.push(new Region(regionStr));
        }
        return regions;
    }

    _getRegionsFromHistogramChunks(intervals, chromosome) {
        let regions = [];
        for (let i = 0; i < intervals.length; i++) {
            let interval = intervals[i];
            let region = new Region(interval);
            region.chromosome = chromosome;
            regions.push(region);
        }
        return regions;
    }

    _computeLimitedRegion(chromosome) {
        let regionLimit = 300000000;

        if (this.species != null && this.species.chromosomes != null && this.species.chromosomes[chromosome] != null) {
            regionLimit = this.species.chromosomes[chromosome].end;
        }

        if (this.chromosomeSizes != null &&
            this.chromosomeSizes[chromosome] != null &&
            !isNaN(this.chromosomeSizes[chromosome])
        ) {
            regionLimit = this.chromosomeSizes[chromosome];
        }

        return regionLimit;
    }

    _computeRegionSize(region) {
        let limitedRegion = this._computeLimitedRegion(region.chromosome);
        if (region.end > limitedRegion) {
            region.end = limitedRegion;
        }
    }
}
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

function ChartWidget(args) {
	var this_ = this;
	this.id = "ChartWidget_" + Math.round(Math.random() * 10000000);

	this.title = null;
	this.width = 750;
	this.height = 300;

	if (args != null) {
		if (args.title != null) {
			this.title = args.title;
		}
		if (args.width != null) {
			this.width = args.width;
		}
		if (args.height != null) {
			this.height = args.height;
		}
	}
};

ChartWidget.prototype.getStore = function() {
	return this.store;
};

ChartWidget.prototype.getChart = function(fields) {
	
	Ext.define('ChromosomeChart', {
	    extend: 'Ext.data.Model',
	    fields: fields
	});
	
	this.store = Ext.create('Ext.data.Store', {
		 model: 'ChromosomeChart',
		 autoLoad : false
	});
	
	var dibujo = Ext.create('Ext.chart.Chart', {
		animate : true,
		shadow : true,
		store : this.store,
		width : this.width,
		height : this.height,
		axes : [{
					position : 'left',
					fields : [fields[0]],
					title : fields[0],
					grid:true,
					type : 'Numeric',
	                minimum: 0 //si no se pone, peta
				}, {
					title : fields[1],
					type : 'category',
					position : 'bottom',
					fields : [fields[1]],
//					width : 10,
					label : {
						rotate : {
							degrees : 270
						}
					}
				}],
		series : [{
					type : 'column',
					axis: 'left',
					gutter: 10,
					yField : fields[0],
					xField : fields[1],
	                style: {
	                    fill: '#38B8BF'
	                }
				}]
	});
	return dibujo;
};/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

function InputListWidget(args) {
	this.id = "InputListWidget" + Math.round(Math.random()*10000000);
		
	this.title = "List";
	this.width = 500;
	this.height = 350;
	this.headerInfo = 'Write a list separated only by lines';
	
	this.args=args;
	
	if (args != null){
        if (args.title!= null){
        	this.title = args.title;       
        }
        if (args.width!= null){
        	this.width = args.width;       
        }
        if (args.height!= null){
        	this.height = args.height;       
        }
        if (args.headerInfo!= null){
        	this.headerInfo = args.headerInfo;       
        }
        if (args.viewer!= null){
        	this.viewer = args.viewer;       
        }
    }
	this.onOk = new Event(this);
};


InputListWidget.prototype.draw = function(text){
	var _this = this;
	
	if (text == null){
		text = new String();
	}
	
	if (this.panel == null){
		this.infobar = Ext.create('Ext.toolbar.Toolbar',{cls:"bio-border-false"});
		this.infoLabel = Ext.create('Ext.toolbar.TextItem', {
				text:this.headerInfo
		});
		this.infobar.add(this.infoLabel);
		this.editor = Ext.create('Ext.form.field.TextArea', {
				id:this.id + "genelist_preview",
	       	 	xtype: 'textarea',
	        	name: 'file',
	        	margin:"-1",
				width : this.width,
				height : this.height,
	        	enableKeyEvents:true,
	        	cls: 'dis',
	        	style:'normal 6px tahoma, arial, verdana, sans-serif',
	        	value: text,
	        	listeners: {
				       scope: this,
				       change: function(){
//				       			var re = /\n/g;
//				       			for( var i = 1; re.exec(this.editor.getValue()); ++i );
//				       			this.infoLabel.setText('<span class="ok">'+i+'</span> <span class="info"> Features detected</span>',false);
				       			this.validate();
				       }
				       
		        }
		});
		var form = Ext.create('Ext.panel.Panel', {
			border : false,
			items : [this.infobar,this.editor]
		});
		
		this.okButton = Ext.create('Ext.button.Button', {
			 text: 'Ok',
			 disabled:true,
			 listeners: {
			       scope: this,
			       click: function(){
			       			var geneNames = Ext.getCmp(this.id + "genelist_preview").getValue().split("\n");
							this.onOk.notify(geneNames);
							_this.panel.close();
			       		}
	        }
		});  
		
		this.panel = Ext.create('Ext.ux.Window', {
			title : this.title,
			taskbar:Ext.getCmp(this.viewer.id+'uxTaskbar'),
			layout: 'fit',
			resizable: false,
			collapsible:true,
			constrain:true,
			closable:true,
			items : [ form ],
			buttons : [ this.okButton, {text : 'Cancel',handler : function() {_this.panel.close();}} ],
			listeners: {
				       scope: this,
				       destroy: function(){
				       		delete this.panel;
				       }
		        }
		});
	}
	this.panel.show();
	
};

InputListWidget.prototype.validate = function (){
	if (this.editor.getValue()!="") {
		this.okButton.enable();
	}else{
		this.okButton.disable();
	}
};
/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

function TextWindowWidget(args){
	this.windows = new Array();
};

TextWindowWidget.prototype.draw = function(text){
//	this.windows.push( window.open(''+self.location,"Bioinformatics",config="height="+500+",width="+800+" ,font-size=8, resizable=yes, toolbar=1, menubar=1"));
//	this.windows[this.windows.length-1].document.write("<title>"+ "asdasda" +"</title>");
//	this.windows[this.windows.length-1].document.write(text);
//	this.windows[this.windows.length-1].document.close();
	
	
	myRef = window.open('data:text/csv,field1%2Cfield2%0Afoo%2Cbar%0Agoo%2Cgai%0A','mywin',
	'left=20,top=20,width=500,height=200');
	
	myRef.document.write(text);
};

function ClienSideDownloaderWindowWidget(args){
	this.windows = new Array();
};

ClienSideDownloaderWindowWidget.prototype.draw = function(text, content){
//	myRef = window.open('data:text/csv,field1%2Cfield2%0Afoo%2Cbar%0Agoo%2Cgai%0A','mywin', 'left=20,top=20,width=500,height=200');
	
	myRef = window.open('data:text/csv,' + content,'mywin', 'left=20,top=20,width=500,height=200');
//	myRef = window.open('data:image/svg+xml,' + content,'mywin', 'left=20,top=20,width=500,height=200');
	
	myRef.document.write(text);
};/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

	/*Nuevo tipo ventana*/
if(typeof Ext != 'undefined'){
    Ext.define("Ext.ux.Window",{
        extend:"Ext.window.Window",
        minimizable:true,
        constrain:true,
        collapsible:true,
        initComponent: function () {
            this.callParent();
            if(this.taskbar!=null){//si no existe, las ventanas funcionan como hasta ahora
                this.zIndexManager = this.taskbar.winMgr;
                this.iconCls='icon-grid';
                this.button=Ext.create('Ext.button.Button', {
                    text:this.title,
                    window:this,
                    iconCls : this.iconCls,
                    handler:function(){
                        if(this.window.zIndexManager.front==this.window){
                            this.window.minimize();
                        }else{
                            this.window.show();
                        }
                    }
                });
                this.taskbar.add(this.button);


                this.contextMenu = new Ext.menu.Menu({
                    items: [{
                        text: 'Close',
                        window:this,
                        iconCls:'tools-icons x-tool-close',
                        handler:function(){this.window.close();}
                    }]
                });
                this.button.getEl().on('contextmenu', function(e){
                    e.preventDefault();
                    this.contextMenu.showAt(e.getX(),e.getY()-10-(this.contextMenu.items.length)*25);
                },this);

                this.button.on('destroy', function(){this.window.close();});

                //Taskbar button can be destroying
                this.on('destroy',function(){if(this.button.destroying!=true){this.button.destroy();}});

                this.on('minimize',function(){this.hide();});
                this.on('deactivate',function(){
                    if(this.zIndexManager && this.zIndexManager.front.ghostPanel){
                        this.zIndexManager.unregister(this.zIndexManager.front.ghostPanel);
                    }
                    this.button.toggle(false);
                });
                this.on('activate',function(){this.button.toggle(true);});

            }
        }
    });
}
//TEMPLATE widget
function Widget(args) {
    _.extend(this, Backbone.Events);

    //set default args
    this.id = Utils.genId("Widget");
    this.target;

    //set instantiation args, must be last
    _.extend(this, args);

    this.on(this.handlers);

    this.rendered = false;
    if (this.autoRender) {
        this.render(this.targetId);
    }
}

Widget.prototype = {
    render: function () {
        var _this = this;
        console.log("Initializing "+this.id);

        //HTML skel
        this.div = document.createElement('div');
        this.div.setAttribute('id', this.id);


//        this.panel = this._createPanel();
    },
    draw: function () {
        this.targetDiv = (this.target instanceof HTMLElement ) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log('target not found');
            return;
        }
        this.targetDiv.appendChild(this.div);

//        this.panel.render(this.div);
    }
}