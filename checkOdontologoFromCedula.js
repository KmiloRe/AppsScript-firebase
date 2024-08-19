const hojaRegistros = 'Registros';
const x = Date.now;
const date = new Date();
const endDate = date.setMinutes(date.getMinutes() + 50);
const date2 = new Date(date.getTime() + 50 * 60000);

const burntdata = {
  "clientNumber": "1000872852",
  "docType": "C.C.",
  "clientName": "Clientoso",
  "consultorio": "Consultorio 4",
  "end": date2,
  "clientID": "delete this field",
  "description": "TEst SHEets",
  "title": "Test",
  "start": date,
  "eventType": "valoracion",
  "odontologoNumber": "101010",
  "prestadoraSalud": "confama",
  "eventId": "desconocido"
}

//todo: end and start must be medidas de tiempo, will have to construct it from the present date 
// todo: end is just start + 30 minutes
//todo: there must be a cloud function, or even here to get de docId and assign it to eventId


function onOpen() {
  getOdontologoID();
  var y = date.toTimeString;
  //console.log(date);
  //console.log(formatTimestamp(date));
  // La función onOpen se ejecuta automáticamente cada vez que se carga un Libro de cálculo
  //todo tal vez que no se ejecute cada vez, para evitar quemar datos repetidos
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
}

function read() {
  getOdontologoID();
}

function write() {
  getFireStore();
}

function getOdontologoID(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetEventos = ss.getSheetByName("SOLO EVENTOS");
  var rangeOdonto = sheetEventos.getRange("B4");
  const odontologoFromCedula = firestore.query("workers_aux").Where("clientNumber", "==", "101012").Execute();
  //const allDocuments = firestore.getDocuments("workers_aux").where("clientNumber","==","1017242634");
  
  if(odontologoFromCedula.length> 0){
    var currentConsultorio = odontologoFromCedula[0].fields["currentConsultorio"].stringValue;
    console.log(currentConsultorio);

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

  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(hojaRegistros);

  const allDocuments = firestore.getDocuments("workers_aux").where("clientNumber","==","1017242634");
 
  var data = [];
 
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
  */
  
   if (data.length > 0) {  
    // write to ss    
    writeInSpreadSheet(data, sheet);
   }
   

}


function formatTimestamp(date) {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  const isPM = hours >= 12;
  hours = hours % 12 || 12; // Convert to 12-hour format
  const period = isPM ? "p.m." : "a.m.";

  const timeZoneOffset = -date.getTimezoneOffset() / 60; // Convert to hours
  const timeZone = `UTC${timeZoneOffset >= 0 ? `-${timeZoneOffset}` : `+${Math.abs(timeZoneOffset)}`}`;

  return `${day} de ${month} de ${year}, ${hours}:${minutes}:${seconds} ${period} ${timeZone}`;
}
