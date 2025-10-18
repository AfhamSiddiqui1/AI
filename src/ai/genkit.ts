import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {googleCloud} from '@genkit-ai/google-cloud';

export const ai = genkit({
  plugins: [
    googleAI(),
    googleCloud({
      // Disallow all functions from being called externally.
      firebaseFunctions: {
        // By default, all flows are deployed as Firebase Functions.
        // You can disable this by setting this to false.
        enabled: true,
        // By default, all flows are deployed with a public endpoint.
        // You can disable this by setting this to false.
        // You can also override this on a per-flow basis.
        allowHttp: false,
      },
    }),
  ],
  // Log all traces to the console.
  // In a production environment, you would want to use a different logger.
  // logger: {
  //   log: (level, ...args) => {
  //     console.log(level, ...args);
  //   },
  //   error: (level, ...args) => {
  //     console.error(level, ...args);
  //   }
  // },
  // In a production environment, you would want to use a different tracer.
  // openTelemetry: {
  //   instrumentation: {
  //     // You can disable instrumentation for specific packages here.
  //     //'@google-ai/generativelanguage': false,
  lng: 'en',
  //   },
  // },
});
