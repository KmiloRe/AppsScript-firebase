//todo: end and start must be medidas de tiempo, will have to construct it from the present date 
// todo: end is just start + 30 minutes
//todo: there must be a cloud function, or even here to get de docId and assign it to eventId
//? duda xaca: profe, sera bueno borrar los console.log() o eso no afecta en nada la ejecución?

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

  menuEntries.push(null);

  ss.addMenu("Acciones de Datos", menuEntries);
  createDropdownConsultorios();
  getFireStore();
}

function createDropdownConsultorios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetEventos = ss.getSheetByName("SOLO EVENTOS");
  const cell = sheetEventos.getRange("G3");
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONSULTORIOS)
    .setAllowInvalid(false)
    .setHelpText("Debes seleccionar un consultorio")
    .build();

  cell.setDataValidation(rule);
}

function cedulaManagement(campo) {
  //If your string contains multiple consecutive spaces, split(" ") 
  //will include empty strings in the array. If you want to ignore 
  //multiple spaces, you can use a regular expression:
  let parts = campo.split(/\s+/);
  // [0] tipo de documento
  // [1] # de documento

  return [parts[0], parts[1]];
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

function read() {
  getOdontologoID();
}

function write() {
  getFireStore();
}

function getOdontologoID() {

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
    console.log("Odontologo Existe");

    return true;
  }
  console.log("Revisar cedula de odontologo en el portal");
  rangeOdonto.setValue("Revisar cedula de odontologo en el portal");
  rangeOdonto.setFontColor("red");

  return false;
}


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

//lee toda la collection especificada
function getFireStore() {


  if (!getOdontologoID()) {
    //mostrar alerta o resaltar linea donde el campo esta vacio
    return "Revisar cedula de odontologo en el portal";
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetEventos = ss.getSheetByName("SOLO EVENTOS");
  //toda la logica aqui


  //all this in a loop
  const consultorio = sheetEventos.getRange("G3").getValue().toString().trim();
  const campoCedula = sheetEventos.getRange("C7").getValue().toString().trim();
  if (campoCedula.length == 0) {
    //mostrar alerta o resaltar linea donde el campo esta vacio
    //pasar a la siguiente linea pues no se puede crear evento para esa linea
  }
  const hora = sheetEventos.getRange("A7").getValue().toString().trim();

  if (hora.length == 0) {
    //mostrar alerta o resaltar linea donde el campo esta vacio
    //pasar a la siguiente linea pues no se puede crear evento para esa linea
  }

  let [inicio, final] = dateHourManagement(hora);



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
  const data = {
    "titlSheet": "Test",
    "clientNumber": "1000872852",
    "docType": "C.C.",
    "clientName": "Clientoso",
    "consultorio": consultorio,
    "end": "",
    "clientID": "delete this field",
    "description": "evento creado desde G Sheets",
    "title": "Test",
    "start": "",
    "eventType": "valoracion",
    "odontologoId": "1",
    "prestadoraSalud": "confama",
    "eventId": "desconocido",
    "pacienteId": ""
  }
  firestore.createDocument("events", data);
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

}