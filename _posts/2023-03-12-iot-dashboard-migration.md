---
layout: post
title: "IoT: Migrating the Traffic Light Dashboard to AWS"
author: "Tyler Sengia"
categories: web, aws, serverless, graphql
tags: [web, aws, serverless, graphql]
---

For my capstone project as Penn State, I built a React JS single page app (SPA) that used Axios to communicate using an obscure IoT protocol known as oneM2M.  
Now I'm migrating that dashboard to AWS to show my work to others.  

# Demo App Instructions
Below are links to the application and the source code.

Instructions for use:
1. Click the <a href="https://main.d357xgwrfyl7b5.amplifyapp.com/" >Demo Link</a> to open up a new window with the dashboard
2. __Open up a second window__, to have two windows with the dashboard
3. Press the "+" button to add a new Intersection, give it a name, you will see it pop-up in both windows
4. Try clicking the different colors to change the light colors
5. Press the red "X" on the top right of an Intersection to delete it

<div class="note" >
  Demo link: <a href="https://main.d357xgwrfyl7b5.amplifyapp.com/" >https://main.d357xgwrfyl7b5.amplifyapp.com/</a><br />
  Source code repository: <a href="https://github.com/tsengia/intersection-dashboard" >tsengia/intersection-dashboard on GitHub</a>
</div>

# Background
One part of my capstone project was to create a web dashboard to control some LEDs using the <a href="https://www.onem2m.org/">oneM2M</a> IoT protocol.
At the center of this oneM2M protocol is a backend server known as the oneM2M CSE. This CSE was essentially a message broker and datastore.  

My project used HTTP carrying JSON messages to communicate with the oneM2M CSE. Now that I'm migrating the dashboard to the cloud, I do not need the oneM2M communications anymore.  

# Step 1: Creating a DynamoDB Table
Since I am no longer using the oneM2M, I now have to create a DynamoDB to store the state of the dashboard.  
The dashboard allows users to control multiple Traffic Intersections. Each Traffic Intersection contains two traffic lights, which can be set to Red, Yellow, or Green.  

The DynamoDB table I created has the following settings:
- Table name: `intersections`
- Partition key: `name: String`
- Table class: Standard
- Capacity Mode: On-demand

I populated my table with the below item for testing:
```json
{
  "name": {
    "S": "Intersection A"
  },
  "light1": {
    "S": "red"
  },
  "light2": {
    "S": "green"
  },
  "ble_state":{
    "S": "Connected"
  }
}
```

For the dashboard, each Intersection has four properties:
- `name` - Name of the intersection, also the partion key for our table
- `light1` - State of the first traffic light
- `light2` - State of the second traffic light
- `ble-state` - Status of the Thingy:91's BLE connection to the ESP32

The valid values for `light1` and `light2` are: `red`, `yellow`, `green`, and `off`.

# Step 2: Creating the GraphQL Schema
Now that I have a DocumentDB table created and an example item to work with, I can create my GraphQL API Schema with AppSync.  

I am skipping using the AWS Schema Wizards. I've tried them out before, but they've confused me more than helped me. Building from the ground up is sometimes easier and more insightful, although I do see the value in a one click and *poof* you have a GraphQL API.

The schema that I am using is below:
```graphql
schema {
  query: Query
  mutation: Mutation
}

type Intersection {
  ble_state: String!
  light1: String!
  light2: String!
  name: String!
}

type Mutation {
  #  Returns the new Intersection
  addIntersection(name: String!): Intersection
  #  Returns the name of the deleted intersection
  removeIntersection(name: String!): String
  #  Returns the updated Intersection
  updateIntersection(ble_state: String, light1: String, light2: String, name: String!): Intersection
}

type Query {
  #  Returns the specified Intersection
  intersection(name: String!): Intersection
  #  Returns a list of Intersections
  intersectionList: [Intersection]
}
```

# Step 3: Create Pipeline Resolvers
With the GraphQL Schema in place, I can now attach my API to the DynamoDB table as a datasource and being writing the resolvers.

While debugging these resolvers, I found it very helpful to enable verbose logging for my AppSync API so that I could see log messages in CloudWatch.

For each pipeline resolver, I am using the following resolver code:
```js
export function request(ctx) {
    return {};
}

export function response(ctx) {
    return ctx.prev.result;
}
```

I'll attach Functions later on to provide the actual operations for DynamoDB.

## List Intersections Function
For the `/intersectionList` Query, I created an AppSync Function named `LIST_INTERSECTIONS`:
```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
    return {
        operation: "Scan"
    };
}

export function response(ctx) {
    if (ctx.error) {
        util.appendError(ctx.error.message, ctx.error.type, ctx.result);
        return null;
    }
    return ctx.result.items;
}
```
This simply issues a `Scan` request on the DynamoDB table to return the list of all `Intersection` objects.
I attached this Function to the `/intersectionList` resolver pipeline.

## Get Intersection Function
For the `/intersection` Query, I created an AppSync Function named `GET_INTERSECTION`:
```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const name = ctx.arguments.name.trim();
    return {
        operation: "GetItem",
        key: util.dynamodb.toMapValues({ name })
    };
}

export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
        util.appendError(error.message, error.type, result);
        return null;
    }
    return result;
}
```
This issues a `GetItem` request on the DynamoDB table to return the requested `Intersection` object.
I attached this Function to the `/intersection` resolver pipeline.

## Add Intersection Function
For the `/addIntersection` Mutation, I created an AppSync Function named `ADD_INTERSECTION`:
```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const name = ctx.arguments.name.trim();
    
    const defaults = {
        "ble_state":"disconnected",
        "light1":"red",
        "light2":"red"
    };
    return {
        operation: "PutItem",
        key: util.dynamodb.toMapValues({ name }),
        attributeValues: util.dynamodb.toMapValues(defaults),
        condition: {
            expression: "attribute_not_exists(#n)",
            expressionNames: {"#n":"name"}
        }
    };
}

export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
        util.appendError(error.message, error.type, result);
        return null;
    }
    return result;
}
```
This simply issues a `PutItem` request on the DynamoDB table to add a new `Intersection` object with default values.
I attached this Function to the `/addIntersection` resolver pipeline.

The gotcha that I encountered with this resolver is that the `PutItem` request will replace an existing object of the same `key` if it already exists.  
For my API, that is not desirable. I would like to return an error if the `key` already exists. Yes, this adds overhead to my API since I have to check if the `key` exists already, but for my simple dashboard application I am ok with this. It took me a bit to understand the condition expressions, and I had to add in the error propagation to the `response()` function.

## Update Intersection Function
For the `/updateIntersection` Mutation, I created an AppSync Function named `UPDATE_INTERSECTION`:
```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
    let { name, ...values } = ctx.arguments;
    name = name.trim();
    
    let set_expressions = [];
    let set_expression_values = {};
    for (const [key, value] of Object.entries(values)) {
        set_expressions.push(`${key} = :${key}`);
        set_expression_values[`:${key}`] = {"S": value};
    }
    let update_expression = set_expressions.length ? `SET ${set_expressions.join(", ")}` : "";

    return {
        operation: "UpdateItem",
        key: util.dynamodb.toMapValues({ name }),
        update: {
            expression: update_expression,
            expressionValues: set_expression_values
        },
        condition: {
            expression: "attribute_exists(#n)",
            expressionNames: {"#n":"name"}
        }
    };
}

export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
       util.appendError(error.message, error.type, result);
       return null;
    }
    return result;
}
```
This simply issues an `UpdateItem` request on the DynamoDB table to add a new `Intersection` object with default values.
I attached this Function to the `/updateIntersection` resolver pipeline.

This Function took a considerably longer amount of time to write. I was unfamiliar with DynamoDB's [update expressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.SET), and how to pass in values substituted into the expression. I recognize that AppSync essentially forces you to make use of the `expressionValues` field when performing `SET` updates. Perhaps this is to sidestep the risk of injection based attacks? Still, I wonder if DynamoDB is susceptible to injection attacks like SQL is notorious for. A quick Google shows that yes, Dynamo DB is vulnerable to injection attacks if you don't validate/filter/escape user input.

Additionally, I originally left out the `condition` expression. I was unaware that if the object does not exists, the update will create the object with the specified values. This led to some interesting errors for me while testing. I had created an interesection, removed it, and then updated it. When I queried `intersectionList` again, I got back a confusing error response instead of the expected `[]` value. This was because the result was not an empty array, but actually contained an incomplete intersection object. By enforcing the constraint that updates can only update existing intersections, this bug went away.

## Remove Intersection Function
For the `/removeIntersection` Mutation, I created an AppSync Function named `UPDATE_INTERSECTION`:
```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const name = ctx.arguments.name.trim();
    return {
        operation: "DeleteItem",
        key: util.dynamodb.toMapValues({ name })
    };
}

export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
        return util.appendError(error.message, error.type, result);
    }
    return result;
}
```
This simply issues an `DeleteItem` request on the DynamoDB table to add a new `Intersection` object with default values.
I attached this Function to the `/removeIntersection` resolver pipeline.

# Step 4: Configuring the ReactJS Client
As mentioned earlier, my old version of the ReactJS dashboard was using the oneM2M communication protocol. 
Now that I am using GraphQL and AWS AppSync, I need to remove the oneM2M code and add in calls to the AppSync client.  

The component-oriented structure of ReactJS allowed me to remove the oneM2M code easily. Then, I installed the AWS AppSync client with:  
```bash
npm install @aws-sdk/client-appsync
```
This pulled in an additional 71 packages, but that's to be expected when using NPM.  

While investigating how to use the AppSync Client, I stumbled upon this gem: [callbackhell.com](http://callbackhell.com/). I agree with this website very much; callbacks can be a pain. I use Promises to make my code look like it is executing synchronously. Promises can still be a bit tricky/hard to grasp at times, but I believe they are worth it.  


In this case, I am not using a fully fledged Amplify project, so I had to follow the instructions for [code generation outside of an Amplify project](https://docs.amplify.aws/cli/graphql/client-code-generation/#introspection-schema-outside-of-an-initialized-project).  

First, I downloaded the GraphQL schema for the API using (some info redacted):  
```bash
aws appsync get-introspection-schema --api-id **************** --format SDL schema.graphql --region ***** --profile ***************
```

Next, I installed the AWS amplify CLI and API Node modules and added the `codegen` Amplify module:
```bash
npm install @aws-amplify/cli @aws-amplify/api
```

Then, I generated the types and JS code using amplify code gen:
```bash
npx amplify add codegen --apiId ****************
```
This command generated an `API.ts` file in my `src/` directory as well as `mutations.ts` and `queries.ts` in `src/graphql`. 

In order for my React app to connect to my GraphQL API, I'll need to provide it the API endpoint and authentication information. However, I don't want to commit these authentication secrets into my source code because then it is publically available to anyone looking at my GitHub repository. Instead, I created an Object that reads in the authentication secrets from a `.env` file using []`create-react-app`'s Environment Variables feature](https://create-react-app.dev/docs/adding-custom-environment-variables/#adding-development-environment-variables-in-env).  

My `.env` file looked like this (information redacted):
```
REACT_APP_AWS_REGION=******
REACT_APP_AWS_GRAPHQLENDPOINT=https://******************.appsync-api.******.amazonaws.com/graphql
REACT_APP_AWS_AUTHENTICATIONTYPE=API_KEY
REACT_APP_AWS_APIKEY=***********************
```

I also created a `src/aws-exports.js` file that exports an object holding the configuration values read from the `.env` file:
```js
const aws_settings = {
    aws_appsync_graphqlEndpoint: process.env.REACT_APP_AWS_GRAPHQLENDPOINT,
    aws_appsync_region: process.env.REACT_APP_AWS_REGION,
    aws_appsync_authenticationType: process.env.REACT_APP_AWS_AUTHENTICATIONTYPE,
    aws_appsync_apiKey: process.env.REACT_APP_AWS_APIKEY,
};

export default aws_settings;
```

The `process.env.REACT_APP_*` variables get replaced by the values read from the `.env` file during the build process, so I do not have to worry about commiting my authentication secrets to my GitHub repository.  

# Step 5: Implementing the ReactJS GraphQL Client
Now that I have removed oneM2M and setup my app to use AWS AppSync, I can now begin writing code to send and receive data from my API.  
I would like to have used React's `useEffect`, but my existing components are all class based, so I will stick to using the regular lifecycle callbacks.  

The first step is to list all available intersections when the app loads in. For this, I added a `componentDidMount` function to my `Dashboard` class:
```js
componentDidMount() {
    API.configure(aws_settings);

    API.graphql( {
        query: intersectionList
    }).then((result) => {
        console.log(result.data.intersectionList);
        let intersection_name_map = {};
        for (let i of result.data.intersectionList) {
            intersection_name_map[i.name] = i;
        }
        this.setState({ intersections: intersection_name_map });
    }).catch((error) => {
        console.error(error);
    });
}
```

I also added callback functions within my `Dashboard` class to handle the addition and deletion of Intersections. I now understand why state management frameworks like Mob-X are popular. Chaining/nesting callbacks to child components is very awkward and potentially hard to read. Most of the state logic was handled in the `Dashboard` class, but I did break out updating the light colors to the child `Intersection` components because updating the light values were something that could contained within the Intersection itself and did not require the parent Dashboard to know about it. I am certainly seeing the benefits of Stateless, Functional Components (SFC), but I am going to stick to a class-based components for now.  

# Step 6:  Adding Realtime Subscriptions
Now that I am able to add, remove, and update Intersections in my dashboard, it is now time to add a realtime subscription mechanism.  

The subscription mechanism that AppSync provides is websocket based. This is great, I'm a fan of websockets. The old, oneM2M version of this dashboard actually used something called HTTP long polling to acheive real-time notifications of events. HTTP long polling is interesting. It's supported [better in older browsers than websockets](https://stackoverflow.com/questions/36290520/longpolling-vs-websockets).

First, I have to add subscriptions into my GraphQL schema using `@aws_subscribe` directives and adding a `Subscription` type.

My GraphQL schema now looks like:
```graphql
type Intersection {
	name: String!
	light1: String!
	light2: String!
	ble_state: String!
}

type Mutation {
	# Returns the new Intersection
	addIntersection(name: String!): Intersection
	# Returns the updated Intersection
	updateIntersection(
		name: String!,
		light1: String,
		light2: String,
		ble_state: String
	): Intersection
	# Returns the name of the deleted intersection
	removeIntersection(name: String!): Intersection
}

type Query {
	# Returns a list of Intersections
	intersectionList: [Intersection]
	# Returns the specified Intersection
	intersection(name: String!): Intersection
}

type Subscription {
	addedIntersection: Intersection
		@aws_subscribe(mutations: ["addIntersection"])
	removedIntersection: Intersection
		@aws_subscribe(mutations: ["removeIntersection"])
	updatedIntersection(name: String): Intersection
		@aws_subscribe(mutations: ["updateIntersection"])
}

schema {
	query: Query
	mutation: Mutation
	subscription: Subscription
}
```

With my schema updated, it is now time to make the ReactJS app connect to the websocket on startup.  
To do this, I will need to know where the realtime endpoint is located. The GraphQL and websock/realtime endpoints are actually two different URLs, which you can discover with the following command:
```bash
aws appsync get-graphql-api --profile ********** --api-id **********
```

This command returns:
```json
{
    "graphqlApi": {
        "name": "IntersectionAPI",
        "apiId": "************************",
        "authenticationType": "API_KEY",
        "logConfig": {
            "fieldLogLevel": "ALL",
            "cloudWatchLogsRoleArn": "arn:aws:iam::************:role/service-role/appsync-graphqlapi-logs-******",
            "excludeVerboseContent": false
        },
        "arn": "arn:aws:appsync:******:************:apis/************************",
        "uris": {
            "REALTIME": "wss://************************.appsync-realtime-api.******.amazonaws.com/graphql",
            "GRAPHQL": "https://************************.appsync-api.******.amazonaws.com/graphql"
        },
        "tags": {},
        "xrayEnabled": false
    }
}
```

From the above output, you can see that the `REALTIME` URI is slightly different from the `GRAPHQL` endpoint. Because of this, I will need to modify my `.env` file to expose the location of the realtime endpoint to my React app.

New `.env` file:
```
REACT_APP_AWS_REGION=******
REACT_APP_AWS_GRAPHQLENDPOINT=https://******************.appsync-api.******.amazonaws.com/graphql
REACT_APP_AWS_REALTIMEENDPOINT=wss://************************.appsync-realtime-api.******.amazonaws.com/graphql
REACT_APP_AWS_AUTHENTICATIONTYPE=API_KEY
REACT_APP_AWS_APIKEY=***********************
```

New `src/aws-exports.js` file:
```js
const aws_settings = {
    aws_appsync_graphqlEndpoint: process.env.REACT_APP_AWS_GRAPHQLENDPOINT,
    aws_appsync_realtimeEndpoint: process.env.REACT_aPP_AWS_REALTIMEENDPOINT,
    aws_appsync_region: process.env.REACT_APP_AWS_REGION,
    aws_appsync_authenticationType: process.env.REACT_APP_AWS_AUTHENTICATIONTYPE,
    aws_appsync_apiKey: process.env.REACT_APP_AWS_APIKEY,
};

export default aws_settings;
```

Additionally, since I've updated the Schema on AWS, I need to refresh the schema on my local git repository:
```bash
npx amplify codegen
```
This command generates an additional TypeScript file at `src/graphql/subscriptions.ts`.  

Now on startup my React app will subscribe to add and remove events on startup.

To subscribe to events, I must make a GraphQL query and save the subscription so that I can cancel it later when the web-app exits (well, if it exits cleanly that is!).
I placed the new subscription calls within `componentDidMount()` and added the unsubscription calls to `componentWillUnmount()` of the Dashboard component.  

At first, I had split some of the state across the Dashboard component and the Intersection components. This caused a litanny of bugs, and ultimately I had to "lift state up" back
to the Dashboard component. Once I had state fully in the Dashboard component, the bugs I was seeing went away.  

# Step 7: Build and Deploy
Now that my React web-app is fully functional, I can connect AWS Amplify to my GitHub repository. Amplify also allows me to add in the environment variables that I left out of my GitHub repository.  

Within a few minutes, my web-app is built, and globally accessible.

# Conclusion
Wow, AWS is awesome.  
I just built a globally available, scalable, serverless web-app in three days.  
Such speed is not possible when coding everything by yourself. Yes, there are some things that AWS does "automagically" for you, such as the Graph QL code generation and using the AWS Amplify JS SDKs. Sometimes "automagical" things can be difficult to use/maintain/configure, but so far that has not been an issue.  

I look forward to continuing to build with AWS and it's "automagical" awesomeness.