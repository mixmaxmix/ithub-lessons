CREATE TABLE IF NOT EXISTS `Audits` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Audit_name` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`Id`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Groupes` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Groupe_name` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`Id`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Subjects` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Subject_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`Id`))
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS `Times` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Time` DATETIME NOT NULL,
  PRIMARY KEY (`Id`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Days` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Day` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`Id`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Teachers` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(45) NOT NULL,
  `Login` VARCHAR(20) NOT NULL,
  `Password` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`Id`),
  INDEX `Login_idx` (`Login` ASC))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Classes` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Groupe_id` INT NOT NULL,
  `Audit_id` INT NOT NULL,
  `Subject_id` INT NOT NULL,
  `Time_id` INT NOT NULL,
  `Day_id` INT NOT NULL,
  `Teacher_id` INT NOT NULL,
  PRIMARY KEY (`Id`),
  INDEX `Audits_idx` (`Audit_id` ASC) ,
  INDEX `Groupes_idx` (`Groupe_id` ASC) ,
  INDEX `Subjects_idx` (`Subject_id` ASC) ,
  INDEX `Times_idx` (`Time_id` ASC) ,
  INDEX `Day_idx` (`Day_id` ASC) ,
  INDEX `Teachers_idx` (`Teacher_id` ASC) ,
  CONSTRAINT `Audits`
    FOREIGN KEY (`Audit_id`)
    REFERENCES `Audits` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `Groupes`
    FOREIGN KEY (`Groupe_id`)
    REFERENCES `Groupes` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `Subjects`
    FOREIGN KEY (`Subject_id`)
    REFERENCES `Subjects` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `Times`
    FOREIGN KEY (`Time_id`)
    REFERENCES `Times` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `Days`
    FOREIGN KEY (`Day_id`)
    REFERENCES `Days` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `Teachers`
    FOREIGN KEY (`Teacher_id`)
    REFERENCES `Teachers` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Students` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(45) NOT NULL,
  `Login` VARCHAR(20) NOT NULL,
  `Password` VARCHAR(20) NOT NULL,
  `Groupe_id` INT NOT NULL,
  PRIMARY KEY (`Id`),
  INDEX `Students_groupes_idx` (`Groupe_id` ASC) ,
  INDEX `Login_idx` (`Login` ASC) ,
  CONSTRAINT `Students_groupes`
    FOREIGN KEY (`Groupe_id`)
    REFERENCES `Groupes` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Curators` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(45) NOT NULL,
  `Login` VARCHAR(20) NOT NULL,
  `Password` VARCHAR(20) NOT NULL,
  `Group_id` INT NOT NULL,
  `Сurated_group_id` INT NOT NULL,
  PRIMARY KEY (`Id`),
  INDEX `Curators_curated_groupe_idx` (`Сurated_group_id` ASC) ,
  INDEX `Curators_groupe_idx` (`Group_id` ASC) ,
  INDEX `Login_idx` (`Login` ASC) ,
  CONSTRAINT `Curators_curated_groupe`
    FOREIGN KEY (`Сurated_group_id`)
    REFERENCES `Groupes` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `Curators_groupe`
    FOREIGN KEY (`Group_id`)
    REFERENCES `Groupes` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Changes` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Was` TEXT NOT NULL,
  `Became` TEXT NOT NULL,
  `Class_id` INT NOT NULL,
  PRIMARY KEY (`Id`),
  INDEX `Class_idx` (`Class_id` ASC) ,
  CONSTRAINT `Class`
    FOREIGN KEY (`Class_id`)
    REFERENCES `Classes` (`Id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Notifications_categs` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Notification_categ_name` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`Id`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `Notifications` (
  `Id` INT NOT NULL AUTO_INCREMENT,
  `Notifications_categ_id` INT NOT NULL,
  `Text` TEXT NULL,
  `Change_id` INT NULL,
  `Sender_id` INT NULL,
  PRIMARY KEY (`Id`),
  INDEX `Notification_categ_idx` (`Notifications_categ_id` ASC) ,
  INDEX `Changes_idx` (`Change_id` ASC) ,
  INDEX `Sender_teacher_idx` (`Sender_id` ASC) ,
  CONSTRAINT `Notification_categ`
    FOREIGN KEY (`Notifications_categ_id`)
    REFERENCES `Notifications_categs` (`Id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `Changes`
    FOREIGN KEY (`Change_id`)
    REFERENCES `Changes` (`Id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `Sender_teacher`
    FOREIGN KEY (`Sender_id`)
    REFERENCES `Teachers` (`Id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `Sender_curator`
    FOREIGN KEY (`Sender_id`)
    REFERENCES `Curators` (`Id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
