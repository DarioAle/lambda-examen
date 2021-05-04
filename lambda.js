const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

exports.handler = async function(event) {
    let req = JSON.parse(event.body);
    let key = process.env.APIKEY;
    
    const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
      version: '2020-08-01',
      authenticator: new IamAuthenticator({
        apikey: key,
      }),
      serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/fdc48b66-3674-4b22-9eb6-7068ca965dd3'
    });
    
    
    const analyzeParams = {
      'text': req.historial_clinico,
      'features': {
        'keywords': {
          'sentiment': true,
          'emotion': true,
          'limit': 5
        },
        'entities' : {
            'sentiment' : true,
            'emotion' : true,
            'limit' : 5
        }
      }
    };

    console.log(analyzeParams.text);

  let returnValue;
    
   await naturalLanguageUnderstanding.analyze(analyzeParams)
      .then(analysisResults => {
        console.log(JSON.stringify(analysisResults, null, 2));

        // keywords processing
        let aux  = [];
        aux = analysisResults.result.keywords;

        aux1 = aux.map( e => e.text);
        aux2 = aux.map(e =>  {
            
            maxEmotionScore = 0;
            maxEmotionKey = null;

            for (const [key, value] of Object.entries(e.emotion)) {
                // console.log(`${key}: ${value}`);
                if( value > maxEmotionScore) {
                    maxEmotionScore = value;
                    maxEmotionScore = key;
                }
            }

            let key = e.text;
            let obj = {}

            obj[key] = { 
                sentiment : e.sentiment.label,
                relevance : e.relevance,
                count : e.count,
                emotion : maxEmotionScore
            }

            return obj;
        })


        ////////////// entities processing
        entitiesAux = analysisResults.result.entities;

        
        aux1Entities = entitiesAux.map( e => e.text);
        aux2Entities = entitiesAux.map(e =>  {
            
            maxEmotionScore = 0;
            maxEmotionKey = null;

            for (const [key, value] of Object.entries(e.emotion)) {
                // console.log(`${key}: ${value}`);
                if( value > maxEmotionScore) {
                    maxEmotionScore = value;
                    maxEmotionScore = key;
                }
            }

            let key = e.text;
            let obj = {}

            obj[key] =  { 
                type : e.type,
                sentiment : e.sentiment.label,
                relevance : e.relevance,
                emotion : maxEmotionScore,
                count : e.count,
                confidence : e.confidence
            }

            return obj
        })



        returnValue = {
            language : analysisResults.result.language,
            keywords : aux1,
            entities : aux1Entities,
            keywords_desc : aux2,
            entities_desc : aux2Entities
        };
      })
      .catch(err => {
        console.log('error:', err);
        returnValue = 'error';
      });

      return buildResponse(200, returnValue);
}


function buildResponse(statusCode, body) {
    return {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
}
// aws lambda update-function-code --function-name my-function --zip-file fileb://function.zip
