TarnOS.Routes.Auth = function(p, s) {
  s.log = s.log || ""

  function log() {
    let line = Array.prototype.slice.call(arguments).map(function(argument) {
      return typeof argument === 'string' ? argument : JSON.stringify(argument);
    }).join(' ');

    s.log += line + '\n';
  }

  return [
    // Header/Title
    div({}, "TarnOS Authenticator"), br(),

    // Button bar
    div({},
      // Scan button
      button({onclick: async () => {
        log("Scan started")

        try {
          const ndef = new NDEFReader()

          await ndef.scan()

          ndef.addEventListener("readingerror", () => {
            log("Argh! Cannot read data from the NFC tag. Try another one?");
          })

          ndef.addEventListener("reading", event => {
            const decoder = new TextDecoder();
            for (const record of event.message.records) {
              log(`Record type: ${record.recordType}
MIME type: ${record.mediaType}
=== data ===
${decoder.decode(record.data)}`);
            }
          })
        } catch (error) {
          log("Argh! " + error);
        }

      }}, "Scan"),

      // Space between buttons
      " ",

      // Clear Button
      button({onclick() {
        s.log = ""
      }}, "Clear")
    ),

    // Log output
    pre({}, s.log)
  ]
}
