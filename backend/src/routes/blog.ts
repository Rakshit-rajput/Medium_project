import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { sign,verify } from "hono/jwt";
import { withAccelerate } from "@prisma/extension-accelerate";

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
        title:string;
    },
    Variables:{
        userId:string
    }
}>();

//Middleware to authenticate User before blog Routes

blogRouter.use('/*',async(c,next)=>{
  const authHeader = c.req.header('Authorization')||"";
  if(!authHeader){
    c.status(401);
    return c.json({error:"unauthorized"});
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = await verify(token,c.env.JWT_SECRET);
  if(!payload){
    c.status(401);
    return c.json({error:"unauthorized"});
  }
  c.set('userId',payload.id);
  await next()
    
  } catch (error) {
    c.status(403);
    return c.json({
        message:"You are not logged in"
    })
    
  }
  
})

//Post Route to post blog posts

blogRouter.post('/', async(c) => {
    // const userId = c.get('userId');
  const body = await c.req.json();
  const authorId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,
  }).$extends(withAccelerate())

 const post =  await prisma.post.create({
    data:{
        title:body.title,
        content:body.content,
        authorId:authorId
    }
  })
  return c.json({
    id: post.id

  })
})

//PUT route to make changes in blog content

blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blog = await prisma.post.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content
        }
    })

    return c.json({
        id:blog.id
    })
})

//Todo:pagination
//Get Route to get all the blog posts
blogRouter.get('/bulk',async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blogs = await prisma.post.findMany({});
    return c.json(blogs)
})


//GET Route to get single Route

blogRouter.get('/:id', async(c) => {
    const id = c.req.param('id');
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
	try {
        const blog = await prisma.post.findUnique({
            where:{
                id
            },
        })
        return c.json({
            blog
        });
        
    } catch (error) {
        c.status(411);
        return c.json({
            message:"Error while fetching blog post"
        });
        
    }
})



