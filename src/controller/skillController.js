import { Prisma } from "../application/prisma.js";
import { Validate } from "../application/validate.js";
import { ResponseError } from "../error/responseError.js";
import skillService from "../service/skillService.js";
import { isID } from "../validation/mainValidation.js";
import { isSkill } from "../validation/skillValidation.js";

// PATH : METHOD 
const getAll = async (req, res) => {
    const data = await Prisma.skill.findMany({
        include: {
            category: true
        }
    })


    res.status(200).json({
        messege: "berhasil ambil data skill",
        data: data
    });
}

// 
const get = async (req, res, next) => {
    try {
        let id = req.params.id;
        id = Validate(isID, id);

        const skill = await Prisma.skill.findUnique({
            where: {
                id: id
            },
            include: {
                category: true
            }
        });

        // HANDLE NOT FOUND
        if (skill == null) throw new ResponseError(404, `skill dengan ${id} tidak ditemukan`);

        res.status(200).json({
            messege: "berhasil mendapat data skill berdasarkan id = " + id,
            data: skill
        });

    } catch (error) {
        next(error)
    }

}

// PATH : METHOD UNTUK MENYIMPAN DATA skill
const post = async (req, res, next) => {
    try {
        let data = req.body;

        data = Validate(isSkill, data);

        // AMBIL ID CATEGORY -> FIND OR CREATE
        // const id_category = await find_or_create_skill_category(data.category);
        const id_category = await skillService.find_or_create_skill_category(data.category);

        // CREATE SKILL
        // buat data skill yang akan disimpan
        const insert_data = {
            title: data.title,
            skillCategoryId: id_category
        }

        const skill_data = await Prisma.skill.create({
            data: insert_data
        });

        res.status(200).json({
            message: "Berhasil menyimpan data skill",
            data: skill_data
        });

    } catch (error) {
        next(error);
    }
}

// PATH : METHOD UNTUK MENYIMPAN DATA skill
const put = async (req, res, next) => {
    try {
        let skill = req.body;
        let id = req.params.id;

        id = Validate(isID, id);

        // START: VALIDATE SKILL
        skill = Validate(isSkill, skill)

        const currentSkill = await Prisma.skill.findUnique({
            where: {
                id: id
            },
            select: {
                id: true,
                skillCategoryId: true
            }
        });

        // handle not found
        if (!currentSkill) throw new ResponseError(404, `skill dengan ${id} tidak ditemukan`);

        // handle category dahulu
        const category_id = await skillService.find_or_create_skill_category(skill.category);


        const update_data = {
            title: skill.title,
            skillCategoryId: category_id
        }

        const updateSkill = await Prisma.skill.update({
            where: {
                id: id
            },
            data: update_data
        });

        // remove category
        // id category sebelumnya
        const previous_skill_id = currentSkill.skillCategoryId;
        await skillService.remove_category(previous_skill_id);


        res.status(200).json({
            messege: "berhasil mengupdate data skill",
            data: updateSkill
        });

    } catch (error) {
        next(error);
    }
}

// PATH : METHOD UNTUK MENYIMPAN DATA skill
const remove = async (req, res, next) => {
    try {
        let id = req.params.id;

        id = Validate(isID, id);

        // END VALIDATE ID

        const currentSkill = await Prisma.skill.findUnique({
            where: {
                id: id
            },
            select: {
                id: true
            }
        });

        if (!currentSkill) throw new ResponseError(404, `skill dengan ${id} tidak ditemukan`);

        // remove category
        // id category sebelumnya
        const previous_skill_id = currentSkill.skillCategoryId;
        await skillService.remove_category(previous_skill_id);

        // EKSEKUSI DELETE
        await Prisma.skill.delete({
            where: {
                id: id
            }
        });

        res.status(200).json({
            messege: "Success"
        });
    } catch (error) {
        next(error);
    }
}

export default {
    getAll,
    get,
    post,
    put,
    remove
}