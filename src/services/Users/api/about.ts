import { Request, Response } from "express";

const about = (req: Request, res: Response) => {
    res.render("users/pages/users-about", {
        layout: "layouts/popup",
        title: "About Users",
    });
};

export default about;
