/* Spring 2025 MAD Project: Victor Campos <vcampos@sdccd.edu> */

// ---- GLOBAL SCOPE VARIABLES START ---- //
// / Keep track of last logged on user for AUTO LOGIN Code
let lastLoggedUser = localStorage.getItem("LastUser");
// / Unitialized Variable for each users PouchDB database
let myDB;
// / Keep track of the last comic we interacted with
let lastComicShown = "";
// ---- GLOBAL SCOPE VARIABLES END ---- //

// ---- VARIOUS CHECKERS START ---- //
// Check when Onsen framework has sucessfully loaded
ons.ready(function(){  
    console.log("Onsen UI is ready!");
    // May also be used with "deviceready" Event...
}); // END ons.ready()

// Check if running on a certain Platform
if(ons.platform.isIPhoneX()){
    document.documentElement.setAttribute('onsflag-iphonex-portrait', '');
    document.documentElement.setAttribute('onsflag-iphonex-landscape', '');
    console.log("Running on iPhone X!");
}else if(ons.platform.isAndroid()){
    console.log("Running on Android!");
}; //  END ons.platform checker

// Check if Cordova has successfully loaded
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady(){
    console.log("Cordova Version: " + device.cordova);
    console.log("Cordova Platform: " + device.platform);
    console.log("Cordova Manufacturer: " + device.manufacturer);
    console.log("Cordova Model: " + device.model);
    console.log("Cordova Version: " + device.version);
    console.log("Cordova UUID: " + device.uuid);
    console.log("Cordova Serial? " + device.serial);
    console.log("Cordova is Virtual? " + device.isVirtual);
}; // END devicready
// ---- VARIOUS CHECKERS END ---- //

// ----  AUTO LOGIN START ---- // 
if(lastLoggedUser === null || lastLoggedUser === "" || lastLoggedUser === undefined || lastLoggedUser === false || lastLoggedUser === "null") {
    console.log("No Last User, go to welcome.html");
    pageLoader("welcome.html");
} else {
    console.log("There is a last logged in user: " + lastLoggedUser);

    let tmpLastLoggedUser = JSON.parse(localStorage.getItem(lastLoggedUser));

    // Borrow the same account switcher from logIn()
    switch(tmpLastLoggedUser.uAge){
        case true:
            pageLoader("homeParent.html");
            
            break;
        case false:
            pageLoader("homeChild.html");
            break;
        case "ADMIN":
            pageLoader("homeAdmin.html");
            break;
        default:
            console.log("Some other possibility to figure out");
            pageLoader("home.html");
            break;
    }; // END switch() account picker

    // Inititialize their dabatase
    fnInitDB();
}; // END Account type checker
// -----  AUTO LOGIN END ----- //

// Function to define a DB based on WHO is logged in
function fnInitDB(){
    console.log("fnInitDB() is running");

    // Re-check LastUser, so it works via AUTO LOGIN or fnLogIn()
    let emailForDB = localStorage.getItem("LastUser");

    // Create or connect to a database, based on their email
    myDB = new PouchDB(emailForDB);

    myDB.info().then(function(greatJob){
        console.log("Db records: " + greatJob.doc_count);
    }).catch(function(aMistake){
        console.log(aMistake);
    }); // END .info() Promise
}; // END fnInitDB()

// document.querySelector("#appNav").bringPageTop("welcome.html");  // BASIC page loader WITH history
// document.querySelector("#appNav").resetToPage("welcome.html");   // BASIC page loader with NO history

// Generic page loader subroutine
function pageLoader(pageID){
    console.log("pageLoader() is running, about to load: " + pageID);
    // NOTE: .resetToPage() clears any nav history
    // Note: .bringPageTop() keeps any nav history <- Usually you want this one
    document.querySelector("#appNav").bringPageTop(pageID);
}; // END pageLoader(pageID)

// Menu-based page loader subroutine
function pageLoaderViaMenu(pageID, menuID){
    console.log("pageLoaderViaMenu() with: " + pageID + " & " + menuID);
    
    // First, close the current menu
    document.querySelector(menuID).close();

    // Detect the screen loading, and update on-screen assets
    document.querySelector("#appNav").bringPageTop(pageID).then(function(worksOK){
        // If we navigated to to the Collection screen, update it; or else it's another screen
        if(pageID === "collection.html"){
            console.log("In collection.html");
            fnComicShow(); // Redraw the screen based on latest database
        }else{
            console.log("NOT in collection.html");
            // No need to redraw the screen based on DB
            if(pageID === "profile.html"){
                myDB.info().then(function(greatJob){
                    // Get user email and number of comics data
                    let tmpProfileUser = localStorage.getItem("LastUser");
                    let tmpProfileDB = greatJob.doc_count;
                    let tmpProfileDate = new Date();
                    document.querySelector("#pProfile").innerHTML = "<p>Hello, <strong>" + tmpProfileUser + "</strong>! You currently have <strong>" + tmpProfileDB + " Comics</strong> in your collection. Today is " + tmpProfileDate.toLocaleDateString() + ".</p>";
                }).catch(function(aMistake){
                    console.log(aMistake);
                }); // END .info()
            }; // END Profile viewer
        }; // END If...Else checker
    }).catch(function(myOops){console.log(myOops);}); // END .bringPageTop() with a Promise
}; // END pageLoaderViaMenu()

// Function to open a side menu, based on its ID
function fnSideMenuOpen(menuID) {
    console.log("fnSideMenuOpen() is running with: " + menuID);
    document.querySelector(menuID).open();
}; // END fnSideMenuOpen(menuID);

// Function to clear fields in Sign Up
function fnSignupClear() { 
    console.log("fnSignupClear() is running");
    document.querySelector("#signupEmail").value = ""; // NO space it's EMPTY
    document.querySelector("#signupPWD").value = "";
    document.querySelector("#signupPWDconf").value = "";
    document.querySelector("#signupAgeTrue").checked = false;
    document.querySelector("#signupAgeFalse").checked = false;
}; // END fnSignupClear()

// Function to create an account
function fnSignUp(){
    console.log("fnSignUp() is running");

    // Define a pattern for a strong PWD: Letters, Numbers, Symbols, Length
    const strongPWD = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\!\@\#\$\^\*\;\-])(?=.{7,})");

    // Read the fields
    let valsignupEmail   = document.querySelector("#signupEmail").value;
    let valsignupPWD     = document.querySelector("#signupPWD").value;
    let valsignupPWDconf = document.querySelector("#signupPWDconf").value;
    console.log("Fields:", valsignupEmail, valsignupPWD, valsignupPWDconf);

    // By default, the app assumes a limited account (a child account)
    let valsignupAge = false;
    // Then based on what they clicked, set the value
    if(document.querySelector("#signupAgeTrue").checked) {
        console.log("TRUE: Old enough");
        valsignupAge = true;
    } else {
        console.log("FALSE: NOT old enough");
        valsignupAge = false;
    }; // END If..Else age checker

    // Pre-pre-check if all fields are filled in before proceeding  /  // To-do also check if they checked Age
    if(valsignupEmail === "" || valsignupPWD === "" || valsignupPWDconf === ""){
        console.log("Missing fields"); 
        ons.notification.alert("Please fill all fields!");
    } else {
        console.log("All filled, proceed");
        // Pre-check if password is strong enough, before proceeding
        if(!strongPWD.test(valsignupPWD)){
            console.log("Password not strong enough");
            ons.notification.alert("Password not strong enough!");
            fnSignupClear();
        } else {
            console.log("Password strong, proceed");
            // Confirm if passwords match
            if(valsignupPWD !== valsignupPWDconf){
                console.log("Password DON'T match");
                ons.notification.alert("Passwords don't match!");
                document.querySelector("#signupPWD").value = "";
                document.querySelector("#signupPWDconf").value = "";
            }else{
                console.log("Passwords match, proceed");
                // Use their email for the localStorage memory location, and clean it up for error avoidance
                let tmpvalsignupEmail = valsignupEmail.toLowerCase();

                // Check if memory location already exists
                if(localStorage.getItem(tmpvalsignupEmail) === null){
                    console.log("New account, proceed");

                    // Bundle the User Account data into one Object using JSON
                    let tmpUser = {
                        "_id" : tmpvalsignupEmail,
                        "uPwd" : valsignupPWD,
                        "uAge" : valsignupAge,
                        "uAdmin" : false
                    }; // END of JSON bundle

                    // BASIC example of basic one piece of data, stored in localStorage
                    // localStorage.setItem(tmpvalsignupEmail, valsignupPWD);

                    // INSTEAD, save a bundle of JSON data to the localStorage, Stringified
                    localStorage.setItem(tmpUser._id, JSON.stringify(tmpUser));

                    console.log("Account created: " + tmpUser._id);
                    ons.notification.alert("Welcome. Account created!");
                    fnSignupClear();
                }else{
                    console.log("Account already exists");
                    ons.notification.alert("You already have an account!");
                }; // END If..Else checker for account existance
            }; // END If..Else checker for PWD matching
        }; // END If..Else Strong PWD checker
    }; // END If..Else all-filled checker
}; // END fnSignUp()

// Function to handle loggin in
function fnLogin(){
    console.log("fnLogin() is running");
    
    let valloginEmail   = document.querySelector("#loginEmail").value;
    let valloginPWD     = document.querySelector("#loginPWD").value;
    let tmpvalloginEmail= valloginEmail.toLowerCase();
    
    // 1st. Check if accounts exists in localStorage    2. Then check if passwords match    3. Then send them to home screen
    if(localStorage.getItem(tmpvalloginEmail) === null){
        console.log("No account, yet");
        ons.notification.alert("No account. Please create one!");
    }else{
        console.log("Trying with: " + tmpvalloginEmail, "and password: " + valloginPWD);
        let tmpLoginUser = JSON.parse(localStorage.getItem(tmpvalloginEmail));
        console.log("Matchy with: " + tmpLoginUser._id, "and password: " + tmpLoginUser.uPwd);

        // BASIC code without JSON data storage
        // if(valloginPWD === localStorage.getItem(tmpvalloginEmail)){
        
        // INSTEAD code WITH the JSON data storage
        if(valloginPWD === tmpLoginUser.uPwd){
            console.log("Email and PWD match, proceed");
            // BASIC page move
            // pageLoader("home.html");

            // INSTEAD Switch between possible end point screens, based on account type (age)
            switch(tmpLoginUser.uAge){
                case true:
                    pageLoader("homeParent.html");
                    break;
                case false:
                    pageLoader("homeChild.html");
                    break;
                case "ADMIN":
                    pageLoader("homeAdmin.html");
                    break;
                default:
                    console.log("Some other possibility to figure out");
                    pageLoader("home.html");
                    break;
            }; // END switch() account picker

            // Set last logged in user in localStorage for AUTO LOGIN code 
            localStorage.setItem("LastUser", tmpLoginUser._id);
            
            // Initialize the DB of this current user
            fnInitDB();
        }else{
            ons.notification.alert("Wrong password!");
        }; // END If..Else password comparer
    }; // END If..Else account exist checker
}; // END fnLogin();

// Function to handle logging out/switching accounts
function logOut(){
    console.log("logOut() is running");
    ons.notification.confirm("Are you sure you want to log out?").then(function(theResponse){
        switch(theResponse){
            case 0:
                console.log("Didn't want to log out");
                break;
            case 1:
                console.log("Logging out");
                document.querySelector("#menuParent").close();
                document.querySelector("#menuChild").close();
                document.querySelector("#menuAdmin").close();
                // Clear Remember Me in localStorage
                localStorage.setItem("LastUser", null);
                // Move us to welcome.html  // This keeps no navigation memory
                document.querySelector("#appNav").resetToPage("welcome.html");
                break;
            default:
                // Unknown unknowns
                console.log(theResponse);
                break;
        }; // END switch() checker
    }).catch(function(theOops){console.log(theOops);});
}; // END logOut(0

// Function to gather the data and bundle into JSON format
function fnComicPrep(){
    console.log("fnComicPrep() is running");

    // Gather the input data
    let valInSaveTitle= document.querySelector("#inSaveTitle").value,
        valInSaveYear = document.querySelector("#inSaveYear").value,
        valInSaveNum =  document.querySelector("#inSaveNum").value,
        valInSaveNote = document.querySelector("#inSaveNote").value;

    console.log("Fields:", valInSaveTitle, valInSaveYear, valInSaveNum, valInSaveNote);

    // Create a unqique _id for the current comic
    // But first, strip out any non-alphanumber characters 👉/\W/g👈 and lowercasify
    let tmp_id = valInSaveTitle.toLowerCase().replace(/\W/g,"") + valInSaveYear + valInSaveNum;
    console.log("_id:", tmp_id);

    // Now bundle all that data into JSON
    let tmpComic  = {
        "_id"   : tmp_id, 
        "cTitle": valInSaveTitle,
        "cYear" : valInSaveYear,
        "cNum"  : valInSaveNum, 
        "cNote" : valInSaveNote
    }; // END of JSON bundle

    console.log("JSON: ", tmpComic);
    console.log("Keys:" , Object.keys(tmpComic));

    // Now, return this bundled data, to any other part of the app that needs it
    return tmpComic;
}; // END fnComicPrep()

// Function to save a comic to the database
function fnComicSave(){
    console.log("fnComicSave() is running");

    // First gather the data, then bundle it in JSON, then .put()
    let aComic = fnComicPrep();
    console.log("About to save: " + aComic._id);

    // PouchDB expects data in JSON format and with a _id Key for every unique entry
    myDB.put(aComic).then(function(pSuccess){
        console.log("Saved a comic! ", pSuccess.id, pSuccess.rev);
        ons.notification.alert("You saved a comic!");
        document.querySelector("#inSaveTitle").value = "";
        document.querySelector("#inSaveYear").value = "";
        document.querySelector("#inSaveNum").value = "";
        document.querySelector("#inSaveNote").value = "";

        // Update the comic collection on-screen: divComicCollection
        fnComicShow();
    }).catch(function(pError){
        console.log("Error:", pError.message);
        ons.notification.alert("You already have the comic!");
    }); // END .put() Promise
}; // END fnComicSave()

// Function to draw a screenful of data (comics)
function fnComicShow(){
    console.log("fnComicsShow() is running");

    // Rertrieve data; "include_docs" for all data; "ascending" for alpha order
    myDB.allDocs({"ascending":true, "include_docs":true}).then(function(pSuccess){ 
        // Before showing data, confirm there is data
        if(pSuccess.rows[0] === undefined){
            console.log("No data yet...");
            document.querySelector("#divComicCollection").innerHTML = "No comics, yet. Save one!";
        }else{
            console.log("Some data:", pSuccess.total_rows, "entries");
            // 1. Create a table, 2. Fill it with the data, 3. Then show it on screen
            
            // 1. Start table and first row // Temporarly have border='1', but then do it right via CSS
            let comicData = "<table><tr><th>Title</th> <th>Year</th> <th>#</th></tr>";
            
            // 2. Fill with data, via For() Loop
            for(let i = 0; i < pSuccess.total_rows; i++){
                // NOTE VERY IMPORTANT THIS IS (+=) NOTTTTTTT (=)! // NOTE: Be caerful of single and double quotes here!
                comicData += "<tr class='btnComicInfo' id='" + pSuccess.rows[i].doc._id + "'><td>" + 
                    pSuccess.rows[i].doc.cTitle + 
                    "</td><td>" + pSuccess.rows[i].doc.cYear + 
                    "</td><td>" + pSuccess.rows[i].doc.cNum + "</td></tr>";
            }; // END For() Loop of building rows
            
            // NOTE VERY IMPORTANT THIS IS (+=) NOTTTTTTT (=)!
            comicData += "</table>";
            
            // 3. Show on screen
            document.querySelector("#divComicCollection").innerHTML = comicData;

            // Then make every row clickable with an Event Listener
            let rowOfComics = document.querySelectorAll(".btnComicInfo");
            // Loop for aRow (0) of rowOfComics (length)
            for(let aRow of rowOfComics){
                // this Object to the Handler Function; which is the row that was clicked
                aRow.addEventListener("click", function(){fnComicPopUp(this);});
            }; // END For Loop
        }; // END .allDocs()
    }).catch(function(pErr){
        console.log("Error: " + pErr);
    }); // END .allDocs()
}; // END fnComicsShow()

function fnComicPopUp(thisRow){
    // FYI "id" is refering to the HTML id Attribute  // "_id" is the PouchDB (JS) reference
    console.log("fnComicPopUp() is running upon: " + thisRow.id);

    // Get the full data of that one entry (thisRow)
    myDB.get(thisRow.id).then(function(pScc){
        console.log("Comic detail of " + pScc._id, Object.keys(pScc));
        
        // Populate a blank popup, but first check if popup has ever popup'd before
        // Be careful: make sure its the ID of <ons-dialog> not <template>!!!!!!!!!!!!!!!!!!
        let popComicDetail = document.querySelector("#comicDetail");
        if(popComicDetail){
            // True, we have prev loaded this popup, so just repopulate fields
            console.log("True, this popup has been used");
            // Note: no need for ons.createElement()
            document.querySelector("#inEditTitle").value    = pScc.cTitle;
            document.querySelector("#inEditYear").value     = pScc.cYear;
            document.querySelector("#inEditNum").value      = pScc.cNum;
            document.querySelector("#inEditNote").value     = pScc.cNote;

            // Be careful: make sure its the ID of <ons-dialog> not <template>!!!!!!!!!!!!!!!!!!
            document.querySelector("#comicDetail").show(); // A bit different than False 
            // Track which comic was clicked
            lastComicShown = pScc._id;
        }else{
            // False we've never prev loaded this; so first population
            console.log("False, first use of popup");
            ons.createElement("comicDetail.html", {"append":true}).then(function(pSuccess){
                document.querySelector("#inEditTitle").value    = pScc.cTitle;
                document.querySelector("#inEditYear").value     = pScc.cYear;
                document.querySelector("#inEditNum").value      = pScc.cNum;
                document.querySelector("#inEditNote").value     = pScc.cNote;
                
                // Show the <ons-dialog> for the first time
                pSuccess.show();
                // Track which comic was clicked
                lastComicShown = pScc._id;
            }).catch(function(pError){console.log(pError);});
        }; // END If..Else checker
    }).catch(function(pErr){
        console.log(pErr);
    }); // END .get()
}; // END fnComicPopUp

// Function to close the comic popup
function fnComicPopUpClose(){
    console.log("fnComicPopUpClose() just closed", lastComicShown);
    // Note: .hide() via <ons-dialog> ID, not <template> ID
    // Be careful: make sure its the ID of <ons-dialog> not <template>!!!!!!!!!!!!!!!!!!
    document.querySelector("#comicDetail").hide();
    // Clear which comic was last clicked
    lastComicShown = "";
}; // END fnComicPopUpClose()

// Delete the current comic
function fnComicDelete(){
    console.log("fnComicDelete() is running upon: " + lastComicShown);
    myDB.get(lastComicShown).then(function(pScc){
        // Before delete, CONFIRM they want to
        ons.notification.confirm("Are you sure?").then(function(pResponse){
            switch(pResponse){
                case 0:
                    console.log("Canceled");
                    break;
                case 1:
                    myDB.remove(pScc).then(function(pResults){
                        console.log("Comic deleted:", pResults.ok);
                        // Redraw the table on screen
                        fnComicShow();
                        // Close the popup
                        fnComicPopUpClose();
                        // No current comic any more
                        lastComicShown = "";
                    }); // END .remove()
                    break;
                default:
                    console.log(pResponse);
                    break;
            }; // END switch()
        }); // END .confirm()
    }).catch(function(pErr){console.log(pErr);}); // END .get();
}; // END fnComicDelete()

// Update any changed data, with a new _rev
function fnComicUpdate(){
    console.log("fnComicUpdate() is running: " + lastComicShown);
    // Read or re-read any currently entryes
    let tmpInTitle  = document.querySelector("#inEditTitle").value,
        tmpInYear   = document.querySelector("#inEditYear").value,
        tmpInNum    = document.querySelector("#inEditNum").value,
        tmpInNote   = document.querySelector("#inEditNote").value;

        console.log(tmpInTitle, tmpInYear, tmpInNum, tmpInNote);

        // First load the comic about to be edited, to update with a new _rev
        myDB.get(lastComicShown).then(function(pScc){
            // Then, reinsert the data, passing in the current _rev
            myDB.put(
                {
                    "cTitle": tmpInTitle,
                    "cYear" : tmpInYear,
                    "cNum"  : tmpInNum,
                    "cNote" : tmpInNote,
                    "_id"   : pScc._id,
                    "_rev"  : pScc._rev
                }
            ).then(function(pScc2){
                console.log("New update:",  pScc2.rev);
                fnComicShow();
                fnComicPopUpClose();
            }); // .put() of reinsert
        }).catch(function(pErr){console.log(pErr);}); // END .get() [aka update]
}; // END fnComicUpdate()

// Delete complete database
function fnComicDBDelete(){
    console.log("fnComicDBDelete() is running");
    // First ask to confirm if deleting is what they want
    ons.notification.confirm("Are you sure you want to delete your whole collection?").then(function(pScc){
        switch(pScc){
            case 0:
                console.log("Chose first NO");
                break;
            case 1:
                console.log("Confirm one more time...");
                ons.notification.confirm("Are you sure? THERE IS NO UNDO!").then(function(pScc2){
                    switch(pScc2){
                        case 0:
                            console.log("Second CANCEL");
                            break;
                        case 1:
                            console.log("PROCEED TO DELETE DB!");
                            myDB.destroy().then(function(pScc3){
                                console.log("Database deleted:", pScc3.ok);
                                // Re-init DB to star anew
                                fnInitDB();
                                ons.notification.alert("All comics gone!");
                            }); // END .destroy()
                            break;
                        default:
                            console.log(pScc2);
                            break;
                    }; // END 2nd Switch
                }); // END of 2nd .cofirm()
                break;
            default:
                console.log(pScc);
                break;
        }; // END 1st Switch
    }).catch(function(pErr){console.log(pErr);}); // END 1st .confirm()
}; // END fnComicDBDelete()