**Firearch has moved to gcloud/firestore library to keep in line with Google's own internal movement away from Firebase and into the Google Cloud Platform**

# FireArch
A [Google Cloud Firestore](https://cloud.google.com/firestore/) object modeling library. Built with influences of the [Mongoose](https://mongoosejs.com/) modeling and access paradigms.

**THIS PACKAGE IS NOT PRODUCTION READY**

## Installation
Firearch can be installed using NPM:

    npm install firearch

## Importing
FireArch can be imported via standard Node.js require:

    const  firearch  =  require('firearch');

## Connecting to Firestore
FireArch creates a connection to Firestore in much the same way [Mongoose](https://mongoosejs.com/) connects to MongoDB:

    firearch.connect(firestoreSettings);

## Authorizing to Firestore
It is recommended to use keyfile authorization and environment variable setup using the `dotenv` NPM package. Simply include the package in your project, download the keyfile from Google Cloud Console and set the following environment variable in a `.env` file at the root of your project.

    GOOGLE_APPLICATION_CREDENTIALS="./path/to/keyfile.json"

## Defining Models
Model definitions are also much the same as [Mongoose](https://mongoosejs.com/):

    const  firearch  =  require('firearch');
    const  Schema  =  firearch.Schema;
    
    const  PostSchema  =  new  Schema({
	    title:  String,
	    subtitle:  String,
	    description:  String,
	    dateAdded:  Date,
	    published:  Boolean,
	    type:  { ref:  'PostType'  },
	    tags:  [{ ref:  'Tag'  }],
	    categories:  [{ ref:  'Category'  }]
    });
    
    PostSchema.virtual('subArticles',  {
	    ref:  'Article',
	    localField:  '_id',
	    foreignField:  'post'
    });
    
    const  autoPopulate  =  function(next)  {
	    this.populate({ path:  'type', model:  'PostType'  });
	    this.populate({ path:  'tags', model:  'Tag'  });
	    this.populate({ path:  'categories', model:  'Category'  });
	    next();
    };
    
    PostSchema.pre('findById',  autoPopulate);
    PostSchema.pre('find',  autoPopulate);
    
    module.exports  =  firearch.model('Post',  PostSchema);

## Document ID (`_id`)
FireArch will automatically replicate the Firebase id of a given document as the `_id` property when saving a document. It is unnecessary to define it within the model.

## Supported Data Types
Limited data type support is available for schema definitions at this time. It is currently limited to:

**String**

    const  PostSchema  =  new  Schema({
	    title:  String
    });

*Usage*

    const  PostSchema  =  new  Schema({
	    title:  'A sweet postime story'
    });

**Date**
Dates will be automatically validated and removed if not valid. Supports Firebase [Timestamp](https://firebase.google.com/docs/reference/js/firebase.firestore.Timestamp) parsing automatically.

    const  PostSchema  =  new  Schema({
	    dateAdded:  Date
    });

*Usage*
***Only timestamps are currently supported.***

    const  PostSchema  =  new  Schema({
	    dateAdded:  1545527985177
    });


**Boolean**

    const  PostSchema  =  new  Schema({
	    published:  Boolean
    });

*Usage*

    const  PostSchema  =  new  Schema({
	    published:  true
    });


**Document Reference**
Document references can be defined in the following way. Ref should be the string name given for another model included in the consuming package. 

    const  PostSchema  =  new  Schema({
	    type:  { ref:  'PostType'  }
    });

*Usage*
This should be a string formatted ID used to reference another document.

    const  PostSchema  =  new  Schema({
	    type:  'PdE5NhE0cPzl3ZfMWPB0'
    });


**Document Reference Array**
Document reference arrays can be defined in the following way. Ref should be the string name given for another model included in the consuming package. 

    const  PostSchema  =  new  Schema({
	    tags:  [{ ref:  'Tag'  }]
    });

*Usage*
This should be an array of string formatted IDs used to reference other documents.

    const  PostSchema  =  new  Schema({
	    tags:  [
		    'cRax97tMdRDkfp1b9kRR',
		    'pSROERvj1RKxsbNByzzP',
		    'KwUrCUDweOjZIY8a5Fxz'
	    ]
    });


## Virtual Fields
Firearch supports virtual field definitions following again in the paradigms used by [Mongoose](https://mongoosejs.com/). Virtual Fields will be populated following the given definitions and do not persist within Firebase. The mechanism will use the given definition to populate the field with documents meeting it.

Currently Virtual Fields will always result in an array.

**Example**
The following example will add a property to the object named `subArticles` which will be an array of documents which are from the `Article` model and have a property `post` that equals the `_id` of the current document.

    PostSchema.virtual('subArticles',  {
	    ref:  'Article',
	    localField:  '_id',
	    foreignField:  'post'
    });

## Hooks
FireArch currently supports **ONLY** `Pre` hooks for models.  Hooks can be used to allow for common function registration for models. The callback function will be provided a next function to be used at completion of the registered callback. The callback function will also have the `this` context of the model's schema. This is generally helpful for setting up autopopulation of model fields on `find` and `findById` . In fact, that is the only supported use at this time. 

**(:shrug)**

    const  autoPopulate  =  function(next)  {
	    this.populate({ path:  'type', model:  'PostType'  });
	    this.populate({ path:  'tags', model:  'Tag'  });
	    this.populate({ path:  'categories', model:  'Category'  });
	    next();
    };
    
    PostSchema.pre('findById',  autoPopulate);
    PostSchema.pre('find',  autoPopulate);

## Population
FireArch supports autopopulation of model properties. The method expects a 'path' which refers to the field defined in the Schema. It also expects a `model` referring to the string name of another model in the consuming package. The `populate` method can be called via `this` only within a Hook at this time. This will be extended to other use-cases in the future.

**IMPORTANT: Population will only occur up to 1 level deep at this time, in order to protect against infinite loop population scenarios!**

**No bully ples.**

    const  autoPopulate  =  function(next)  {
	    this.populate({ path:  'type', model:  'PostType'  });
	    this.populate({ path:  'tags', model:  'Tag'  });
	    this.populate({ path:  'categories', model:  'Category'  });
	    next();
    };

## Using A Model

 **.save(object)**
 The save method will validate the given object against the Schema and save the document to Firebase. Returns a Promise.

    const post = {
	    title:  'A sweet postime story'
    };
    
    Post.save(post)
    
    // result
    {
	    _id: '0rWZiCXFQyfSQGkhI5Ay',
	    title: 'A sweet postime story'
    }
  
   **.findById(id)**
 The findById method retrieves a Document by id.  Returns a Promise.
    
    Post.findById('IRjTSGf2VqTZbn1HVen9');
    
 **.find(field, operator, value)**
 The find method accepts the same fields as as Firestore queries, essentially acting as an interface for them. `field` should be the *field* to filter on **(:eye-roll)**.  `operator` should be a Firestore-supported operator: `<`, `<=`, `==`, `>`, `>=`, or `array_contains`.  `value` should be....well, the value to look for. These parameters are optional and FireArch will fall back to returning all documents for a model.  Returns a Promise.

    // Perform Firestore query
    Post.find('title',  '==',  'A sweet postime story');
    
    // Return all Posts
    Post.find();
  
   **.removeById(id)**
 The removeById method deletes a Document by id.  Returns a Promise.
    
    Post.removeById('IRjTSGf2VqTZbn1HVen9');
    
 **.remove(field, operator, value)**
 The remove method accepts the same fields as as Firestore queries, essentially acting as an interface for them. `field` should be the *field* to filter on **(:eye-roll)**.  `operator` should be a Firestore-supported operator: `<`, `<=`, `==`, `>`, `>=`, or `array_contains`.  `value` should be....well, the value to look for. These parameters are all **required**.  Returns a Promise.

    // Perform Firestore query
    Post.remove('title',  '==',  'A sweet postime story');
  
   **.updateById(id, updateObject)**
 The updateById method updates a Document by id. Uses `{ merge: true }` to only update the properties given in the updateObject.  Returns a Promise.
    
    Post.updateById('IRjTSGf2VqTZbn1HVen9', { title: 'Some other title' });
    
 **.update(field, operator, value, updateObj)**
 The update method accepts the same fields as as Firestore queries, essentially acting as an interface for them. `field` should be the *field* to filter on **(:eye-roll)**.  `operator` should be a Firestore-supported operator: `<`, `<=`, `==`, `>`, `>=`, or `array_contains`.  `value` should be....well, the value to look for. These parameters are all **required**. Uses `{ merge: true }` to only update the properties given in the updateObject. Updates all matching Documents. Returns a Promise.

    // Perform Firestore query
    Post.update('title',  '==',  'A sweet postime story', { title: 'Some other title });

## Why
Given that there aren't any other good, simple Mongoose-like libraries out there for Firebase someone had to start one. This is it.

**Contributing**
FireArch is at a very initial stage and is welcome to help from contributors. Fork and create a Pull Request!

**Contributors**
Steven Halase ([email](mailto:steven.halase@gmail.com))
You? ....maybe?