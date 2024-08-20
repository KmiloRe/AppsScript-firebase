//todo: end and start must be medidas de tiempo, will have to construct it from the present date 
// todo: end is just start + 30 minutes
//todo: there must be a cloud function, or even here to get de docId and assign it to eventId
//? duda xaca: profe, sera bueno borrar los console.log() o eso no afecta en nada la ejecución?

//? duda xaca: profe, clientUID lo tengo para que una Cloud F lo reemplaze por el uid del paciente
// o solo con la cedula ya basta, la pregunta es pq tambien puedo obtener el uid por la cedula haciendo
// un query extra a firebase, no se que sea más economico

const data4firebase = {
  "clientNumber": "",
  "docType": "CC",
  "clientName": "Sin nombre",
  "consultorio": "Consultorio_2",
  "end": "",
  "description": "evento creado desde G Sheets",
  "title": "Test",
  "start": "",
  "eventType": "valoracion",
  "odontologoId": "1",
  "prestadoraSalud": "confama",
  "eventId": "desconocido",
  "pacienteId": "",
  "pacienteName": ""
}

const filas_Con_error = []

const CONSULTORIOS = [
  "Consultorio_1",
  "Consultorio_2",
  "Consultorio_3",
  "Consultorio_4",
  "Consultorio_5",
  "Consultorio_6",
  "Consultorio_7",
  "Consultorio_8",
  "Consultorio_9",
  "Consultorio_10",
  "Consultorio_11",
]

const TIPO = [
  "valoracion",
  "urgencia",
  "revision"
]
//todo K: maybe hacer una lista de cedulas validas de odontologo para no hacer query a firebase?

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // La función onOpen se ejecuta automáticamente cada vez que se carga un Libro de cálculo
  var menuEntries = [];

  menuEntries.push({
    name: "Leer eventos (Agenda)",
    functionName: "read",
  });

  menuEntries.push({
    name: "Enviar fire (Solo eventos)",
    functionName: "write"
  });
  
  var menuEntries2 = []

  menuEntries2.push({
    name: "Restablecer archivo",
    functionName: "restablecer"
  })

  menuEntries.push(null);
  menuEntries2.push(null);


  ss.addMenu("Acciones de Datos", menuEntries);
  ss.addMenu("Finalizar por estos eventos", menuEntries2);

  createDropdowns();
  //getVariables(7);
  //pacienteNameManagement();
  getFireStore();
  }

function read() {
  getOdontologoID();
}

function write() {
  getFireStore();
}

function restablecer(){
  //delete all rows from 6 and bellow exept filas_con_error
}

function createDropdowns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetEventos = ss.getSheetByName("SOLO EVENTOS");
  const cell = sheetEventos.getRange("G3");
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONSULTORIOS)
    .setAllowInvalid(false)
    .setHelpText("Debes seleccionar un consultorio")
    .build();

  cell.setDataValidation(rule);

  const cell2 = sheetEventos.getRange("K3");
  const rule2 = SpreadsheetApp.newDataValidation()
    .requireValueInList(TIPO)
    .setAllowInvalid(false)
    .setHelpText("Debes seleccionar un tipo de cita")
    .build();

  cell2.setDataValidation(rule2);
}

function pacienteNameManagement(campo){
  let parts = campo.split("-");
  return parts[0].trim();
}

function cedulaManagement(campo) {
  //If your string contains multiple consecutive spaces, split(" ") 
  //will include empty strings in the array. If you want to ignore 
  //multiple spaces, you can use a regular expression:
  let parts = campo.split(/\s+/);
  // [0] tipo de documento
  // [1] # de documento

  return [parts[0].trim(), parts[1].trim()];
}

function dateHourManagement(startHour) {
  const date = new Date();
  let parts = startHour.split(":");
  date.setHours(parts[0]);
  date.setMinutes(parts[1]);
  date.setSeconds(0);
  date.setMilliseconds(0);

  let datefinal = new Date(date.getTime());
  datefinal.setMinutes(datefinal.getMinutes() + 30);

  return [date, datefinal];
}

function getOdontologoID() {
  //todo k: also get odontologoUID from firebase and set it to data4firebase
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetEventos = ss.getSheetByName("SOLO EVENTOS");
  var odontologoCedula = sheetEventos.getRange("C3").getValue().toString().trim();

  var rangeOdonto = sheetEventos.getRange("B4");
  var odontologoFromCedula = firestore.query("workers_aux").Where("clientNumber", "==", odontologoCedula).Execute();

  if (odontologoFromCedula.length > 0) {
    var currentConsultorio = odontologoFromCedula[0].fields["currentConsultorio"].stringValue;
    var consultorioNumber = currentConsultorio.substr(currentConsultorio.length - 1);
    rangeOdonto.setValue("Odontologo en Consultorio # " + consultorioNumber);
    rangeOdonto.setFontColor("green");
    //console.log("Odontologo Existe");

    return true;
  }
  //console.log("Revisar cedula de odontologo en el portal");
  rangeOdonto.setValue("Revisar cedula de odontologo en el portal");
  rangeOdonto.setFontColor("red");

  return false;
}

// todo k: modify and use this
function writeInSpreadSheet(data, current_sheet) {
  var numRows = data.length;
  if (numRows > 0) {
    var numCols = data[0].length;

    var Avals = current_sheet.getRange("B1:B").getValues();
    var last_row = Avals.filter(String).length;
    last_row++;
    current_sheet.getRange(last_row, 1, numRows, numCols).setValues(data);
  }
}

//? duda xaca: profe, el ciclo muere cuando encuentra un valor vacio en la finla en vez de saltar a la siguiente

function getVariables(iteration) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetEventos = ss.getSheetByName("SOLO EVENTOS");

  //in the future I would like to do some data cleaning here

  const horaRaw = sheetEventos.getRange("A"+iteration);
  const hora = horaRaw.getValue().toString().trim();

  const pacienteNameRaw = sheetEventos.getRange("B"+iteration);
  const pacienteName = pacienteNameRaw.getValue().toString().trim();
  
  const campoCedulaRaw = sheetEventos.getRange("C"+iteration);
  const campoCedula = campoCedulaRaw.getValue().toString().trim();

  //todo k: quizas usar algo asi
  //const campoCedula = campoCedulaRaw.getValue().toString().trim()?? "";

  
  
  //console.log(campoCedula);
  //todo k: if consultorio not selected return false, show in sheet that it must be selected
  //todo k: run better checks for improper data types
  if(hora.length == 0){
    horaRaw.setBackground("red");

    return false;
  }
  if(pacienteName.length == 0){
    pacienteNameRaw.setBackground("red");

    return false;
  }
  if (campoCedula.length == 0) {
    //mostrar alerta o resaltar linea donde el campo esta vacio
    //pasar a la siguiente linea pues no se puede crear evento para esa linea
    campoCedulaRaw.setBackground("red");
    //añadir iteration (fila) a filas_Con_error
    return false;
  }
  //todo k: add conditionals for other variables

  //todo k: get consultorio from sheet
  //todo k: get nombre del servicio from sheet
  //todo k: get tipo afiliado from sheet

  let [inicio, final] = dateHourManagement(hora);
  
  let name = pacienteNameManagement(pacienteName);

  let [tipoDocumento, numeroDocumento] = cedulaManagement(campoCedula);

  if(numeroDocumento.length < 4){
    campoCedulaRaw.setBackground("red");
    return false;
  }

  //todo k: .trim() everything
  data4firebase.start = inicio;
  data4firebase.end = final;
  data4firebase.pacienteName = name;
  data4firebase.docType = tipoDocumento;
  data4firebase.clientNumber = numeroDocumento;

  return true;
}

function getFireStore() {


  if (!getOdontologoID()) {
    //mostrar alerta o resaltar linea donde el campo esta vacio
    return "Revisar cedula de odontologo en el portal";
    //todo k: poner rojo campo de cedula odontologo
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetEventos = ss.getSheetByName("SOLO EVENTOS");
  //toda la logica aqui
  //!inicialmente ira quemado hasta i < 23, cambiar eso once in production
  var row = 0;
  for (var i = 7; i < 31; i++) {
    if (getVariables(i)) {
      //push to firebase 
      //
      console.log(data4firebase);
    }
    else {
      console.log("Error detectado por getVariables en linea"+i);
      //add the i value at the time to an array in order to mark the rows as con errores
      filas_Con_error.push(i);
    }


  }

  //all this in a loop
  //!changing the odontologo´s consultorio won´t be a feature until after production is up for a while
  //const consultorio = sheetEventos.getRange("G3").getValue().toString().trim();

  


  //console.log(getOdontologoID);
  //if (getOdontologoID()) {

  /*
      // Define the range: from column A, row 7 to column I, row 30
      var range = sheetEventos.getRange(7, 1, 24, 9); // (startRow, startColumn, numRows, numColumns)
  
      // Get the values in the specified range
      var dataRows = range.getValues();
  
      // Log the data to see it in the Apps Script console (optional)
      Logger.log(dataRows);
  
      // Process the data (example: iterate through the rows)
      for (var i = 0; i < dataRows.length; i++) {
        var row = dataRows[i];
        // Do something with each row
        Logger.log(row);
      }
      dateHourManagement();
      */
  //firestore.createDocument("events", data);
  //}
  //var rangeError = sheetEventos.getRange("G4");
  //rangeError.setValue("Error");
  //rangeError.setFontColor("orange");

  /* for (var i = 0; i < 2; i++) {
     const data = {
       "titlSheet": "Test" + i,
       "clientNumber": "1000872852" + i,
       "docType": "C.C.",
       "clientName": "Clientoso",
       "consultorio": "Consultorio 4",
       "end": date2,
       "clientID": "delete this field",
       "description": "evento creado desde G Sheets",
       "title": "Test" + i,
       "start": date,
       "eventType": "valoracion",
       "odontologoId": "1",
       "prestadoraSalud": "confama",
       "eventId": "desconocido",
       "pacienteId":""
     }
     firestore.createDocument("events", data);
   }*/


  //var ss = SpreadsheetApp.getActiveSpreadsheet();
  //var sheet = ss.getSheetByName(hojaRegistros);

  //const allDocuments = firestore.getDocuments("workers_aux").where("clientNumber", "==", "1017242634");

  //var data = [];



  // for each column and row in the document selected
  /*
  for(var i = 0; i < allDocuments.length; i++){
 
   var document_key = allDocuments[i].name.split("/").pop();
   var nombre = allDocuments[i].fields["comercialName"].stringValue;
   //var agregado = new Date(allDocuments[i].fields["agregado"].timestampValue).toISOString();
 
   data.push([
     document_key,
     nombre,
     //agregado,
   ]);
   
 
  }
  

  if (data.length > 0) {
    // write to ss    
    writeInSpreadSheet(data, sheet);
  }
  */
  console.log(filas_Con_error);

}