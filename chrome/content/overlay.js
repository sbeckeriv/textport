var textport = {
  _template: null,
  template: function(){
    this.prefs
      return textport._template || "From:<%= h.author %>\nTo:<%= h.recipients %>\nCC:<%= h.ccList %>\nBCC:<%= h.bccList %>\nSubject:<%= h.subject %>\nFolder:<%=folder_name%>\n___::<%= h.messageId%>::<%=h.date%>::___\n<%= body %>\n___::<%= h.messageId%>::<%=h.date%>::___\n";

  },
  observe: function(subject, topic, data)
  {
    if (topic != "nsPref:changed")
    {
      return;
    }
    switch(data)
    {
      case "template":
        this._template = this.prefs.getCharPref("template");
        break;
    }
  },
  onLoad: function() {
            // initialization code #stub code from builder thanks Mozilla
            this.initialized = true;
            this.strings = document.getElementById("textport-strings");
            this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
              .getService(Components.interfaces.nsIPrefService)
              .getBranch("extensions.textport.");
            this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
            this.prefs.addObserver("", this, false);
            var t = this.prefs.getCharPref("template");
            if(t && t.length>0){
              this._template = this.prefs.getCharPref("template");
            }

          },
  saveSelectedMessages: function(){
                          var messages =  gFolderDisplay.selectedMessages;
                          var i;
                          var folder = {name:"messages"} ;
                          var name;
                          var oneFile =this.prefs.getBoolPref("oneMessageFile");
                          var master_file="";
                          var template = new EJS({text:textport.template()});
                          
                          for(i=0;i<messages.length;i++){
                            var h=messages[i];
                            var m;
                            MsgHdrToMimeMessage(h,null,function(ah,mm){m=mm;});
                            var body = textport.getMessageBody(h);       
                            data = {h:h,m:m,body:body,folder_name:h.folder.name};
                            var message = template.render(data);
                            if(!oneFile){
                              try{
                                var dirService = Components.classes["@mozilla.org/file/directory_service;1"].
                                  getService(Components.interfaces.nsIProperties); 
                                var homeDirFile = dirService.get("Home", Components.interfaces.nsIFile); // returns an nsIFile object
                                var homeDir = homeDirFile.path;
                                var file = Components.classes["@mozilla.org/file/local;1"].
                                  createInstance(Components.interfaces.nsILocalFile);
                                file.initWithPath(homeDir+"/mail/"+h.date+"_"+h.messageId+".txt");
                                textport.saveToFile(file,message);
                              }catch(e){
                              }
                            }else{
                              master_file += message+"\n\n";                          
                            }
                          }
                          if(oneFile){
                            var dirService = Components.classes["@mozilla.org/file/directory_service;1"].
                              getService(Components.interfaces.nsIProperties); 
                            var homeDirFile = dirService.get("Home", Components.interfaces.nsIFile); // returns an nsIFile object
                            var homeDir = homeDirFile.path;
                            var file = Components.classes["@mozilla.org/file/local;1"].
                              createInstance(Components.interfaces.nsILocalFile);
                            file.initWithPath(homeDir+"/mail/"+(new Date).getTime()+".txt");
                            textport.saveToFile(file,master_file);
                          }
                        },
  saveMessages: function(){
                  var folder_list = GetSelectedMsgFolders();
                  var i;
                  var list = [];
                  var oneFile =this.prefs.getBoolPref("oneMessageFile");
                  var master_file="";
                  var template = new EJS({text:textport.template()});
                  for(i=0;i<folder_list.length;i++){
                    var folder = GetSelectedMsgFolders()[i];
                    var e = folder.msgDatabase.EnumerateMessages();
                    if ( e ) {
                      while ( e.hasMoreElements() ) {
                        var m=e.getNext();
                        var h=m.QueryInterface(Components.interfaces.nsIMsgDBHdr);
                        var body = textport.getMessageBody(h);       
                        data = {h:h,m:m,body:body,folder_name:folder.name};
                        var message = template.render(data);
                        if(!oneFile)
                          //https://developer.mozilla.org/en/Code_snippets/File_I%2F%2FO
                          try{
                            var dirService = Components.classes["@mozilla.org/file/directory_service;1"].
                              getService(Components.interfaces.nsIProperties); 
                            var homeDirFile = dirService.get("Home", Components.interfaces.nsIFile); // returns an nsIFile object
                            var homeDir = homeDirFile.path;

                            var file = Components.classes["@mozilla.org/file/local;1"].
                              createInstance(Components.interfaces.nsILocalFile);
                            file.initWithPath(homeDir+"/mail/"+m.date+"_"+m.messageId+".txt");
                            textport.saveToFile(file,message);
                          }catch(e){
                          }
                        else{
                          master_file += message+"\n\n";
                        }
                      }
                    }
                  }
                  if(oneFile){
                    var dirService = Components.classes["@mozilla.org/file/directory_service;1"].
                      getService(Components.interfaces.nsIProperties); 
                    var homeDirFile = dirService.get("Home", Components.interfaces.nsIFile); // returns an nsIFile object
                    var homeDir = homeDirFile.path;
                    var file = Components.classes["@mozilla.org/file/local;1"].
                      createInstance(Components.interfaces.nsILocalFile);
                    file.initWithPath(homeDir+"/mail/"+(new Date).getTime()+".txt");
                    textport.saveToFile(file,master_file);
                  }
                },
  saveCSVContacts: function(e){                  
                     var folder_list = GetSelectedMsgFolders();
                     var i;
                     var list = [];
                     var seen={};
                     var csv="";
                     for(i=0;i<folder_list.length;i++){
                       var folder = GetSelectedMsgFolders()[i];
                       var e = folder.msgDatabase.EnumerateMessages();
                       if ( e ) {
                         while ( e.hasMoreElements() ) {
                           var m=e.getNext();
                           var h=m.QueryInterface(Components.interfaces.nsIMsgDBHdr);
                           csv=textport.buildCSV(csv,h,folder,seen);
                         }
                       }
                     }
                     try{
                       var dirService = Components.classes["@mozilla.org/file/directory_service;1"].
                         getService(Components.interfaces.nsIProperties); 
                       var homeDirFile = dirService.get("Home", Components.interfaces.nsIFile); // returns an nsIFile object
                       var homeDir = homeDirFile.path;

                       var file = Components.classes["@mozilla.org/file/local;1"].
                         createInstance(Components.interfaces.nsILocalFile);
                       file.initWithPath(homeDir+"/contacts/"+folder.name+".csv");
                       textport.saveToFile(file,csv);
                     }catch(e){
                       debugger
                     }
                   },
  csvMessages: function(){
                 var messages =  gFolderDisplay.selectedMessages;
                 var i;
                 var csv='';
                 var seen={};
                 var folder = {name:"messages"} ;
                 var name;
                 for(i=0;i<messages.length;i++){
                   name = name || messages[i].folder.name;
                   folder.name="Messages-"+name;
                   csv=textport.buildCSV(csv,messages[i],folder,seen);
                 }
                 try{
                   var dirService = Components.classes["@mozilla.org/file/directory_service;1"].
                     getService(Components.interfaces.nsIProperties); 
                   var homeDirFile = dirService.get("Home", Components.interfaces.nsIFile); // returns an nsIFile object
                   var homeDir = homeDirFile.path;
                   var file = Components.classes["@mozilla.org/file/local;1"].
                     createInstance(Components.interfaces.nsILocalFile);
                   file.initWithPath(homeDir+"/contacts/"+folder.name+"-"+(new Date).getTime()+".csv");
                   textport.saveToFile(file,csv);
                 }catch(e){
                   debugger
                 }
               },
  buildCSV: function(csv,h,folder,seen){
              if(!seen[h.author]){
                seen[h.author] = true;
                var parts = h.author.split(/<|>/);
                var line = folder.name+",'"+h.author+"','"+parts[0]+"','"+parts[1]+"'";
                csv += line + "\n";
              }
              var ii;
              var r= h.recipients.split(",");
              r = r.concat(h.ccList.split(","));
              r = r.concat(h.bccList.split(","));
              for(ii=0;ii<r.length;ii++){
                if(r[ii].length>0 && !seen[r[ii]]){
                  seen[r[ii]] = true;
                  parts = r[ii].split(/<|>/);
                  line = folder.name+",'"+r[ii]+"','"+parts[0]+"','"+parts[1]+"'";
                  csv += line + "\n";
                }
              }
              return csv;
            },
  //got from post on mozzine or some where. i should get the url
  getMessageBody: function(aMessageHeader)  { 
                    var messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger); 
                    var listener = Components.classes["@mozilla.org/network/sync-stream-listener;1"].createInstance(Components.interfaces.nsISyncStreamListener); 
                    var uri = aMessageHeader.folder.getUriForMsg(aMessageHeader); 
                    messenger.messageServiceFromURI(uri).streamMessage(uri, listener, null, null, false, ""); 
                    var folder = aMessageHeader.folder; 
                    return folder.getMsgTextFromStream(listener.inputStream, aMessageHeader.Charset, 65536, 32768, false, true, { }); 
                  },
  saveToFile: function(file,data){
                //direct from mozzila's doc
                var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                  createInstance(Components.interfaces.nsIFileOutputStream);

                // use 0x02 | 0x10 to open file for appending.
                foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
                // write, create, truncate
                // In a c file operation, we have no need to set file mode with or operation,
                // directly using "r" or "w" usually.

                // if you are sure there will never ever be any non-ascii text in data you can 
                // also call foStream.writeData directly
                var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                  createInstance(Components.interfaces.nsIConverterOutputStream);
                converter.init(foStream, "UTF-8", 0, 0);
                converter.writeString(data);
                converter.close(); // this closes foStream
              }
};

window.addEventListener("load", function () { textport.onLoad(); }, false);
