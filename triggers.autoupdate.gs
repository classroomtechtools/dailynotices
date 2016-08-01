// This trigger is no longer in use.

function triggerAutoUpdate(e) {
   app.backend.
     triggers.
     autoUpdate(app.config.sheetNames.archive, app.config.updateString);  // TODO: Add to Admin sheet
}

